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
            return Response(
                {'error': 'employee is required'},
                status=400
            )

        try:
            emp = User.objects.get(pk=emp_id)

        except User.DoesNotExist:
            return Response(
                {'error': 'Employee not found'},
                status=404
            )

        data = {
            k: (v if v != '' else '0')
            for k, v in request.data.items()
        }

        # ── CTC validation ─────────────────────────────
        try:
            ctc    = Decimal(str(data.get('ctc', 0)))
            basic  = Decimal(str(data.get('basic', 0)))
            hra    = Decimal(str(data.get('hra', 0)))
            da     = Decimal(str(data.get('da', 0)))
            sp     = Decimal(str(data.get('special_allowance', 0)))
            tr     = Decimal(str(data.get('transport', 0)))
            med    = Decimal(str(data.get('medical', 0)))
            oth    = Decimal(str(data.get('other_allowance', 0)))

            pf_er  = Decimal(str(data.get('pf_employer', 0)))
            esi_er = Decimal(str(data.get('esi_employer', 0)))

            gross_components = (
                basic + hra + da + sp + tr + med + oth
            )

            total_ctc = gross_components + pf_er + esi_er

            ctc_diff = abs(ctc - total_ctc)

            ctc_warning = None

            if ctc > 0 and ctc_diff > Decimal('100'):
                ctc_warning = (
                    f"CTC ₹{ctc} does not match "
                    f"components total ₹{total_ctc}. "
                    f"Difference: ₹{ctc_diff}"
                )

        except Exception:
            ctc_warning = None

        # deactivate old structure
        SalaryStructure.objects.filter(
            employee=emp,
            is_active=True
        ).update(is_active=False)

        serializer = SalaryStructureSerializer(data=data)

        if serializer.is_valid():
            obj = serializer.save(created_by=request.user)

            resp = serializer.data

            if ctc_warning:
                resp = dict(resp)
                resp['ctc_warning'] = ctc_warning

            return Response(resp, status=201)

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
            return Response(None, status=200)

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
            # Clear existing entries so they can be recalculated fresh
            if run.status == 'processed':
                run.entries.all().delete()

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

        # Recalculate totals.
        # Gross = full earnings (LOP is a deduction, NOT baked into gross).
        entry.gross = (
            entry.basic + entry.hra + entry.da +
            entry.special_allowance + entry.transport +
            entry.medical + entry.other_allowance + entry.ot_pay
        )
        entry.total_deductions = (
            entry.pf_employee + entry.esi_employee +
            entry.pt + entry.tds + entry.lop_deduction
        )
        entry.net_pay = max(entry.gross - entry.total_deductions, Decimal('0'))
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
            entry.net_pay          = max(entry.net_pay - amount, Decimal('0'))
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
# Add these new views at the bottom of payroll/views.py

# ── DEDUCTION HISTORY — MY OWN ────────────────────────────────────────────────

class MyDeductionHistoryView(APIView):
    """
    Employee sees their own deduction history across all months.
    Shows every deduction type per month with totals.
    """
    permission_classes = [make_permission('view_payslip')]

    def get(self, request):
        year = request.query_params.get('year', date.today().year)

        entries = PayrollEntry.objects.filter(
            employee             = request.user,
            payroll_run__status  = 'locked',
            payroll_run__year    = year,
        ).select_related('payroll_run').order_by(
            'payroll_run__year', 'payroll_run__month'
        )

        history = []
        for e in entries:
            run = e.payroll_run
            history.append({
                'month':          run.month,
                'year':           run.year,
                'gross':          float(e.gross),
                'present_days':   float(e.present_days),
                'working_days':   int(e.working_days),
                'lop_days':       float(e.lop_days),
                'ot_hours':       float(e.ot_hours),
                'ot_pay':         float(e.ot_pay),
                # Every deduction broken out
                'pf_employee':    float(e.pf_employee),
                'esi_employee':   float(e.esi_employee),
                'pt':             float(e.pt),
                'tds':            float(e.tds),
                'lop_deduction':  float(e.lop_deduction),
                'total_deductions': float(e.total_deductions),
                'net_pay':        float(e.net_pay),
                # Adjustments
                'adjustments': [
                    {
                        'type':   adj.type,
                        'amount': float(adj.amount),
                        'reason': adj.reason,
                    }
                    for adj in e.adjustments.all()
                ],
            })

        # YTD totals
        ytd = {
            'gross':           sum(h['gross']           for h in history),
            'net_pay':         sum(h['net_pay']         for h in history),
            'pf_employee':     sum(h['pf_employee']     for h in history),
            'esi_employee':    sum(h['esi_employee']    for h in history),
            'pt':              sum(h['pt']              for h in history),
            'tds':             sum(h['tds']             for h in history),
            'lop_deduction':   sum(h['lop_deduction']   for h in history),
            'total_deductions':sum(h['total_deductions']for h in history),
            'lop_days':        sum(h['lop_days']        for h in history),
            'ot_hours':        sum(h['ot_hours']        for h in history),
            'ot_pay':          sum(h['ot_pay']          for h in history),
            'months_paid':     len(history),
        }

        return Response({'year': year, 'ytd': ytd, 'history': history})


# ── DEDUCTION HISTORY — BY EMPLOYEE (Admin/HR) ────────────────────────────────

class EmployeeDeductionHistoryView(APIView):
    """
    Admin/HR sees any employee's full deduction history.
    Also supports comparing multiple employees side by side.
    """
    permission_classes = [make_permission('view_payroll')]

    def get(self, request, emp_id):
        year = request.query_params.get('year', date.today().year)

        try:
            emp = User.objects.get(pk=emp_id)
        except User.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=404)

        entries = PayrollEntry.objects.filter(
            employee            = emp,
            payroll_run__status = 'locked',
            payroll_run__year   = year,
        ).select_related('payroll_run', 'salary_structure').order_by(
            'payroll_run__year', 'payroll_run__month'
        )

        history = []
        for e in entries:
            run = e.payroll_run
            history.append({
                'entry_id':      e.id,
                'month':         run.month,
                'year':          run.year,
                'gross':         float(e.gross),
                'present_days':  float(e.present_days),
                'working_days':  int(e.working_days),
                'lop_days':      float(e.lop_days),
                'ot_hours':      float(e.ot_hours),
                'ot_pay':        float(e.ot_pay),
                'pf_employee':   float(e.pf_employee),
                'esi_employee':  float(e.esi_employee),
                'pt':            float(e.pt),
                'tds':           float(e.tds),
                'lop_deduction': float(e.lop_deduction),
                'total_deductions': float(e.total_deductions),
                'net_pay':       float(e.net_pay),
                'adjustments': [
                    {
                        'type':   adj.type,
                        'amount': float(adj.amount),
                        'reason': adj.reason,
                    }
                    for adj in e.adjustments.all()
                ],
            })

        ytd = {
            'gross':            sum(h['gross']            for h in history),
            'net_pay':          sum(h['net_pay']          for h in history),
            'pf_employee':      sum(h['pf_employee']      for h in history),
            'esi_employee':     sum(h['esi_employee']     for h in history),
            'pt':               sum(h['pt']               for h in history),
            'tds':              sum(h['tds']              for h in history),
            'lop_deduction':    sum(h['lop_deduction']    for h in history),
            'total_deductions': sum(h['total_deductions'] for h in history),
            'lop_days':         sum(h['lop_days']         for h in history),
            'ot_hours':         sum(h['ot_hours']         for h in history),
            'ot_pay':           sum(h['ot_pay']           for h in history),
            'months_paid':      len(history),
        }

        return Response({
            'employee': {
                'id':       emp.id,
                'name':     emp.get_full_name() or emp.username,
                'email':    emp.email,
                'role':     emp.role,
                'emp_type': emp.employee_type,
                'emp_code': getattr(getattr(emp, 'profile', None), 'emp_code', ''),
            },
            'year':    year,
            'ytd':     ytd,
            'history': history,
        })


# ── ALL EMPLOYEES DEDUCTION SUMMARY (Admin/HR) ────────────────────────────────

class AllDeductionSummaryView(APIView):
    """
    Admin/HR dashboard — summary of all employees' deductions
    for a given month/year. Good for spotting high LOP, TDS anomalies.
    """
    permission_classes = [make_permission('view_payroll')]

    def get(self, request):
        month = int(request.query_params.get('month', date.today().month))
        year  = int(request.query_params.get('year',  date.today().year))

        entries = PayrollEntry.objects.filter(
            payroll_run__month  = month,
            payroll_run__year   = year,
            payroll_run__status = 'locked',
        ).select_related(
            'employee',
            'employee__profile',
            'employee__profile__department',
        ).order_by('employee__first_name')

        data = []
        for e in entries:
            try:
                emp_code = e.employee.profile.emp_code
                dept     = e.employee.profile.department.name \
                           if e.employee.profile.department else '—'
            except Exception:
                emp_code = ''
                dept     = '—'

            data.append({
                'emp_id':        e.employee.id,
                'emp_code':      emp_code,
                'name':          e.employee.get_full_name() or e.employee.username,
                'department':    dept,
                'present_days':  float(e.present_days),
                'working_days':  int(e.working_days),
                'lop_days':      float(e.lop_days),
                'ot_hours':      float(e.ot_hours),
                'gross':         float(e.gross),
                'pf_employee':   float(e.pf_employee),
                'esi_employee':  float(e.esi_employee),
                'pt':            float(e.pt),
                'tds':           float(e.tds),
                'lop_deduction': float(e.lop_deduction),
                'total_deductions': float(e.total_deductions),
                'net_pay':       float(e.net_pay),
                'has_lop':       e.lop_days > 0,
                'has_ot':        e.ot_hours > 0,
            })

        # Org summary
        summary = {
            'total_employees':   len(data),
            'employees_with_lop': sum(1 for d in data if d['has_lop']),
            'employees_with_ot':  sum(1 for d in data if d['has_ot']),
            'total_gross':        sum(d['gross']            for d in data),
            'total_net':          sum(d['net_pay']          for d in data),
            'total_pf':           sum(d['pf_employee']      for d in data),
            'total_esi':          sum(d['esi_employee']     for d in data),
            'total_tds':          sum(d['tds']              for d in data),
            'total_lop':          sum(d['lop_deduction']    for d in data),
            'total_deductions':   sum(d['total_deductions'] for d in data),
            'total_lop_days':     sum(d['lop_days']         for d in data),
        }

        return Response({
            'month':   month,
            'year':    year,
            'summary': summary,
            'entries': data,
        })


# ── DASHBOARD STATS API ───────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    """
    Returns role-appropriate stats for the dashboard home.
    Employee: their own attendance + leave + last payslip
    Admin/HR: org-wide headcount + payroll + leave stats
    """
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        from attendance.models import AttendanceRecord
        from leave.models import LeaveRequest, LeaveBalance
        from employees.models import EmployeeProfile

        today = date.today()
        role  = request.user.role

        if role in ('admin', 'superadmin', 'hr'):
            return self._admin_stats(request, today)
        elif role == 'manager':
            return self._manager_stats(request, today)
        else:
            return self._employee_stats(request, today)

    def _employee_stats(self, request, today):
        from attendance.models import AttendanceRecord
        from leave.models import LeaveRequest, LeaveBalance

        # This month attendance
        att = AttendanceRecord.objects.filter(
            employee    = request.user,
            date__year  = today.year,
            date__month = today.month,
        )
        present = att.filter(status__in=['present', 'late']).count()
        absent  = att.filter(status='absent').count()
        lop     = att.filter(status='absent').count() + \
                  att.filter(status='half_day').count() * 0.5

        # Today
        today_att = att.filter(date=today).first()

        # Leave balances
        balances = LeaveBalance.objects.filter(
            employee = request.user,
            year     = today.year,
        ).select_related('leave_type')

        # Pending leave requests
        pending_leaves = LeaveRequest.objects.filter(
            employee = request.user,
            status   = 'pending',
        ).count()

        # Last payslip
        last_payslip = PayrollEntry.objects.filter(
            employee            = request.user,
            payroll_run__status = 'locked',
        ).select_related('payroll_run').order_by(
            '-payroll_run__year', '-payroll_run__month'
        ).first()

        return Response({
            'role': 'employee',
            'attendance': {
                'present_this_month': present,
                'absent_this_month':  absent,
                'lop_this_month':     lop,
                'today_checked_in':   bool(today_att and today_att.check_in),
                'today_checked_out':  bool(today_att and today_att.check_out),
                'today_status':       today_att.status if today_att else 'not_started',
            },
            'leave': {
                'pending_requests': pending_leaves,
                'balances': [
                    {
                        'name':      b.leave_type.name,
                        'code':      b.leave_type.code,
                        'remaining': float(b.remaining),
                        'total':     float(b.total),
                    }
                    for b in balances
                ],
            },
            'last_payslip': {
                'month':             last_payslip.payroll_run.month if last_payslip else None,
                'year':              last_payslip.payroll_run.year  if last_payslip else None,
                'net_pay':           float(last_payslip.net_pay)          if last_payslip else 0,
                'gross':             float(last_payslip.gross)            if last_payslip else 0,
                'lop_days':          float(last_payslip.lop_days)         if last_payslip else 0,
                'lop_deduction':     float(last_payslip.lop_deduction)    if last_payslip else 0,
                'pf':                float(last_payslip.pf_employee)      if last_payslip else 0,
                'tds':               float(last_payslip.tds)              if last_payslip else 0,
                'total_deductions':  float(last_payslip.total_deductions) if last_payslip else 0,
            },
        })

    def _admin_stats(self, request, today):
        from employees.models import EmployeeProfile
        from attendance.models import AttendanceRecord
        from leave.models import LeaveRequest

        total_emp   = User.objects.filter(is_active=True).count()
        total_dept  = EmployeeProfile.objects.values(
            'department'
        ).distinct().count()

        today_att   = AttendanceRecord.objects.filter(date=today)
        checked_in  = today_att.filter(check_in__isnull=False).count()

        pending_leaves = LeaveRequest.objects.filter(status='pending').count()

        last_run = PayrollRun.objects.order_by(
            '-year', '-month'
        ).first()

        last_run_data = None
        if last_run:
            entries = PayrollEntry.objects.filter(payroll_run=last_run)
            last_run_data = {
                'month':          last_run.month,
                'year':           last_run.year,
                'status':         last_run.status,
                'total_net':      float(sum(e.net_pay         for e in entries)),
                'total_gross':    float(sum(e.gross           for e in entries)),
                'total_pf':       float(sum(e.pf_employee     for e in entries)),
                'total_tds':      float(sum(e.tds             for e in entries)),
                'total_lop':      float(sum(e.lop_deduction   for e in entries)),
                'employees_paid': entries.filter(
                    payroll_run__status='locked'
                ).count(),
                'employees_lop':  entries.filter(lop_days__gt=0).count(),
            }

        return Response({
            'role': 'admin',
            'headcount': {
                'total_employees':    total_emp,
                'total_departments':  total_dept,
                'checked_in_today':   checked_in,
                'pending_leaves':     pending_leaves,
            },
            'last_payroll': last_run_data,
        })

    def _manager_stats(self, request, today):
        from attendance.models import AttendanceRecord
        from leave.models import LeaveRequest

        # Manager's team — employees where manager = request.user
        team_ids = User.objects.filter(
            profile__manager = request.user
        ).values_list('id', flat=True)

        today_att  = AttendanceRecord.objects.filter(
            date=today, employee_id__in=team_ids
        )
        checked_in = today_att.filter(check_in__isnull=False).count()
        absent     = len(team_ids) - checked_in

        pending = LeaveRequest.objects.filter(
            employee_id__in = team_ids,
            status          = 'pending',
        ).count()

        return Response({
            'role': 'manager',
            'team': {
                'total':           len(team_ids),
                'checked_in_today': checked_in,
                'absent_today':    absent,
                'pending_leaves':  pending,
            },
        })