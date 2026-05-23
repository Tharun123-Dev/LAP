# payroll/views.py
from datetime import date, datetime
from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from django.shortcuts import get_object_or_404
from django.db import transaction

from utils.permissions import make_permission, IsAuthenticatedUser
from accounts.models import User
from .models import SalaryStructure, PayrollRun, PayrollEntry, PayrollAdjustment
from .serializers import (
    SalaryStructureSerializer, PayrollRunSerializer,
    PayrollEntrySerializer, AdjustmentSerializer
)
from .engine import process_payroll_run


# ── SALARY STRUCTURE ──────────────────────────────────────────────────────────

class SalaryStructureListView(APIView):
    permission_classes = [make_permission('view_salary')]

    def get(self, request):
        emp_id = request.query_params.get('employee')
        qs = SalaryStructure.objects.select_related(
            'employee', 'employee__profile'
        ).filter(is_active=True)

        if emp_id:
            qs = qs.filter(employee_id=emp_id)

        return Response(SalaryStructureSerializer(qs, many=True).data)


class CreateSalaryStructureView(APIView):
    permission_classes = [make_permission('configure_salary')]

    def post(self, request):
        emp_id = request.data.get('employee')
        if not emp_id:
            return Response({'error': 'employee is required'}, status=400)

        try:
            emp = User.objects.get(pk=emp_id)
        except User.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=404)

        # Deactivate old structure
        SalaryStructure.objects.filter(employee=emp, is_active=True).update(is_active=False)

        serializer = SalaryStructureSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class UpdateSalaryStructureView(APIView):
    permission_classes = [make_permission('configure_salary')]

    def patch(self, request, pk):
        structure = get_object_or_404(SalaryStructure, pk=pk)
        serializer = SalaryStructureSerializer(
            structure, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class MySalaryStructureView(APIView):
    """Employee views their own salary structure."""
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        structure = SalaryStructure.objects.filter(
            employee=request.user, is_active=True
        ).order_by('-effective_date').first()

        if not structure:
            return Response({'detail': 'No salary structure assigned yet'}, status=404)

        return Response(SalaryStructureSerializer(structure).data)


# ── PAYROLL RUNS ──────────────────────────────────────────────────────────────

class PayrollRunListView(generics.ListAPIView):
    queryset           = PayrollRun.objects.all()
    serializer_class   = PayrollRunSerializer
    permission_classes = [make_permission('view_payroll')]


class CreatePayrollRunView(APIView):
    permission_classes = [make_permission('process_payroll')]

    def post(self, request):
        month = int(request.data.get('month', date.today().month))
        year  = int(request.data.get('year',  date.today().year))
        notes = request.data.get('notes', '')

        if PayrollRun.objects.filter(month=month, year=year).exists():
            return Response(
                {'error': f'Payroll run for {month}/{year} already exists'},
                status=400
            )

        run = PayrollRun.objects.create(
            month        = month,
            year         = year,
            notes        = notes,
            processed_by = request.user,
            status       = 'draft',
        )
        return Response(PayrollRunSerializer(run).data, status=201)


class ProcessPayrollRunView(APIView):
    """Calculate payroll for all employees in the run."""
    permission_classes = [make_permission('process_payroll')]

    def post(self, request, pk):
        run = get_object_or_404(PayrollRun, pk=pk)

        if run.status == 'locked':
            return Response({'error': 'Payroll is locked and cannot be reprocessed'}, status=400)

        with transaction.atomic():
            created, skipped = process_payroll_run(run)
            run.status       = 'processed'
            run.processed_by = request.user
            run.save()

        return Response({
            'message':  f'Payroll processed for {run.month}/{run.year}',
            'created':  len(created),
            'skipped':  skipped,
            'run':      PayrollRunSerializer(run).data,
        })


class ApprovePayrollRunView(APIView):
    """Admin approves and locks payroll — no further changes after this."""
    permission_classes = [make_permission('approve_payroll')]

    def post(self, request, pk):
        run = get_object_or_404(PayrollRun, pk=pk)

        if run.status != 'processed':
            return Response(
                {'error': f'Payroll must be in processed state to approve. Current: {run.status}'},
                status=400
            )

        run.status      = 'locked'
        run.approved_by = request.user
        run.locked_at   = datetime.now()
        run.save()

        return Response({
            'message': f'Payroll {run.month}/{run.year} approved and locked',
            'run':     PayrollRunSerializer(run).data,
        })


class PayrollRunDetailView(APIView):
    permission_classes = [make_permission('view_payroll')]

    def get(self, request, pk):
        run     = get_object_or_404(PayrollRun, pk=pk)
        entries = PayrollEntry.objects.filter(
            payroll_run=run
        ).select_related('employee', 'employee__profile', 'salary_structure')

        return Response({
            'run':     PayrollRunSerializer(run).data,
            'entries': PayrollEntrySerializer(entries, many=True).data,
        })


# ── PAYROLL ENTRY ─────────────────────────────────────────────────────────────

class UpdatePayrollEntryView(APIView):
    """Manual override for a single employee's entry before approval."""
    permission_classes = [make_permission('process_payroll')]

    def patch(self, request, pk):
        entry = get_object_or_404(PayrollEntry, pk=pk)

        if entry.payroll_run.status == 'locked':
            return Response({'error': 'Cannot edit a locked payroll'}, status=400)

        editable = ['basic', 'hra', 'da', 'special_allowance', 'transport',
                    'medical', 'other_allowance', 'tds', 'lop_days', 'lop_deduction']

        for field in editable:
            if field in request.data:
                setattr(entry, field, request.data[field])

        # Recalculate totals
        entry.gross = (
            entry.basic + entry.hra + entry.da +
            entry.special_allowance + entry.transport +
            entry.medical + entry.other_allowance + entry.ot_pay
        )
        entry.total_deductions = (
            entry.pf_employee + entry.esi_employee +
            entry.pt + entry.tds + entry.lop_deduction
        )
        entry.net_pay = entry.gross - entry.total_deductions
        entry.save()

        return Response(PayrollEntrySerializer(entry).data)


# ── ADJUSTMENTS ───────────────────────────────────────────────────────────────

class AddAdjustmentView(APIView):
    permission_classes = [make_permission('process_payroll')]

    def post(self, request, entry_pk):
        entry = get_object_or_404(PayrollEntry, pk=entry_pk)

        if entry.payroll_run.status == 'locked':
            return Response({'error': 'Cannot adjust a locked payroll'}, status=400)

        adj_type = request.data.get('type')
        amount   = Decimal(str(request.data.get('amount', 0)))
        reason   = request.data.get('reason', '')

        if adj_type not in ['bonus', 'reimbursement', 'deduction', 'arrear']:
            return Response({'error': 'Invalid adjustment type'}, status=400)

        adj = PayrollAdjustment.objects.create(
            payroll_entry = entry,
            type          = adj_type,
            amount        = amount,
            reason        = reason,
            added_by      = request.user,
        )

        # Apply adjustment to net_pay
        if adj_type in ['bonus', 'reimbursement', 'arrear']:
            entry.net_pay += amount
            entry.gross   += amount
        else:  # deduction
            entry.net_pay        -= amount
            entry.total_deductions += amount
        entry.save()

        return Response(AdjustmentSerializer(adj).data, status=201)


# ── MY PAYSLIP ────────────────────────────────────────────────────────────────

class MyPayslipListView(APIView):
    permission_classes = [make_permission('view_payslip')]

    def get(self, request):
        entries = PayrollEntry.objects.filter(
            employee=request.user,
            payroll_run__status='locked',
        ).select_related('payroll_run', 'salary_structure').order_by(
            '-payroll_run__year', '-payroll_run__month'
        )
        return Response(PayrollEntrySerializer(entries, many=True).data)


class MyPayslipDetailView(APIView):
    permission_classes = [make_permission('view_payslip')]

    def get(self, request, month, year):
        entry = PayrollEntry.objects.filter(
            employee=request.user,
            payroll_run__month=month,
            payroll_run__year=year,
            payroll_run__status='locked',
        ).select_related('payroll_run', 'salary_structure', 'employee__profile').first()

        if not entry:
            return Response({'detail': 'Payslip not found'}, status=404)

        return Response(PayrollEntrySerializer(entry).data)


# ── PAYROLL REGISTER (Admin/HR) ───────────────────────────────────────────────

class PayrollRegisterView(APIView):
    """Summary for all employees in a run — used for bank transfer file."""
    permission_classes = [make_permission('view_payroll')]

    def get(self, request, pk):
        run = get_object_or_404(PayrollRun, pk=pk)
        entries = PayrollEntry.objects.filter(
            payroll_run=run
        ).select_related(
            'employee', 'employee__profile', 'employee__profile__department'
        )

        data = []
        for e in entries:
            try:
                bank_account = e.employee.profile.bank_account
                ifsc         = e.employee.profile.ifsc_code
                emp_code     = e.employee.profile.emp_code
            except Exception:
                bank_account = ''
                ifsc         = ''
                emp_code     = ''

            data.append({
                'emp_code':     emp_code,
                'name':         e.employee.get_full_name(),
                'bank_account': bank_account,
                'ifsc':         ifsc,
                'net_pay':      float(e.net_pay),
                'gross':        float(e.gross),
                'total_deductions': float(e.total_deductions),
                'lop_days':     float(e.lop_days),
                'present_days': float(e.present_days),
            })

        summary = {
            'total_gross':   float(sum(e.gross for e in entries)),
            'total_net':     float(sum(e.net_pay for e in entries)),
            'total_pf':      float(sum(e.pf_employee for e in entries)),
            'total_esi':     float(sum(e.esi_employee for e in entries)),
            'total_tds':     float(sum(e.tds for e in entries)),
            'total_lop':     float(sum(e.lop_deduction for e in entries)),
            'employee_count': entries.count(),
        }

        return Response({
            'run':     PayrollRunSerializer(run).data,
            'summary': summary,
            'entries': data,
        })