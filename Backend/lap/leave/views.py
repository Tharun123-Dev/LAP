# leave/views.py
from datetime import date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from django.shortcuts import get_object_or_404

from utils.permissions import make_permission, IsAuthenticatedUser
from accounts.models import User
from .models import LeaveType, LeaveBalance, LeaveRequest
from .serializers import LeaveTypeSerializer, LeaveBalanceSerializer, LeaveRequestSerializer
from .utils import (
    count_working_days, get_or_create_balance,
    init_balances_for_employee, process_carry_forward,
    get_leave_balance_summary,
)


# ── LEAVE TYPES ───────────────────────────────────────────────────────────────

class LeaveTypeListCreateView(generics.ListCreateAPIView):
    serializer_class = LeaveTypeSerializer

    def get_queryset(self):
        return LeaveType.objects.filter(is_active=True)

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticatedUser()]
        return [make_permission('configure_leave')()]


class LeaveTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset         = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticatedUser()]
        return [make_permission('configure_leave')()]


# ── LEAVE BALANCE ─────────────────────────────────────────────────────────────

class MyLeaveBalanceView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        year = int(request.query_params.get('year', date.today().year))

        # Auto-init if no balances
        count = LeaveBalance.objects.filter(employee=request.user, year=year).count()
        if count == 0:
            init_balances_for_employee(request.user, year)

        # Use detailed summary (includes carry-forward breakdown)
        summary = get_leave_balance_summary(request.user, year)
        return Response(summary)


class InitBalanceView(APIView):
    permission_classes = [make_permission('configure_leave')]

    def post(self, request):
        emp_id = request.data.get('employee_id')
        year   = request.data.get('year', date.today().year)

        if not emp_id:
            return Response({'error': 'employee_id required'}, status=400)
        try:
            emp = User.objects.get(pk=emp_id)
        except User.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=404)

        count = init_balances_for_employee(emp, year)
        return Response({'message': f'{count} balances initialised for {emp.username}'})


class CarryForwardView(APIView):
    """
    POST /api/leave/carry-forward/
    Body: { "year": 2025 }   ← the year ENDING (carry from 2025 to 2026)
    Processes EL/PL carry-forward for all employees.
    Admin/HR only.
    """
    permission_classes = [make_permission('configure_leave')]

    def post(self, request):
        year = int(request.data.get('year', date.today().year - 1))
        result = process_carry_forward(year)
        return Response({
            'message': f"Carry-forward processed: {result['processed']} entries from {result['year_from']} → {result['year_to']}",
            **result,
        })


# ── APPLY LEAVE ───────────────────────────────────────────────────────────────

class ApplyLeaveView(APIView):
    permission_classes = [make_permission('apply_leave')]

    def post(self, request):
        lt_id     = request.data.get('leave_type')
        start_str = request.data.get('start_date')
        end_str   = request.data.get('end_date')
        session   = request.data.get('session', 'full')
        reason    = request.data.get('reason', '').strip()

        if not all([lt_id, start_str, end_str, reason]):
            return Response(
                {'error': 'leave_type, start_date, end_date, reason are required'},
                status=400,
            )

        try:
            start = date.fromisoformat(start_str)
            end   = date.fromisoformat(end_str)
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)

        if end < start:
            return Response({'error': 'end_date must be after start_date'}, status=400)

        try:
            lt = LeaveType.objects.get(pk=lt_id, is_active=True)
        except LeaveType.DoesNotExist:
            return Response({'error': 'Leave type not found'}, status=404)

        # Notice period check — reads SystemSetting first, falls back to LeaveType.min_notice_days
        from attendance.settings_helper import get_leave_advance_notice_days
        system_notice = get_leave_advance_notice_days(lt.code)
        effective_notice = system_notice if system_notice > 0 else lt.min_notice_days
        if effective_notice > 0:
            notice_days = count_working_days(date.today(), start)
            if notice_days < effective_notice:
                return Response({
                    'error': f'{lt.name} requires {effective_notice} working day(s) advance notice. '
                             f'Please apply at least {effective_notice} working day(s) before the leave date.'
                }, status=400)

        # Calculate days using settings-aware count
        days = count_working_days(start, end, session)

        # Balance check — use current year
        year    = date.today().year
        balance = get_or_create_balance(request.user, lt, year)

        if balance.remaining < days:
            return Response({
                'error': f'Insufficient balance. Available: {balance.remaining} day(s), Requested: {days}'
            }, status=400)

        # Monthly cap check (for CL)
        try:
            from attendance.settings_helper import _get
            cl_cap = int(_get('cl_monthly_cap', 0))
            if lt.code == 'CL' and cl_cap > 0:
                this_month_used = LeaveRequest.objects.filter(
                    employee=request.user,
                    leave_type=lt,
                    start_date__year=start.year,
                    start_date__month=start.month,
                    status__in=['approved', 'pending'],
                ).exclude(pk=0)
                total_this_month = sum(float(r.days) for r in this_month_used) + days
                if total_this_month > cl_cap:
                    return Response({
                        'error': f'CL monthly cap is {cl_cap} day(s). You have already used/applied for {total_this_month - days} day(s) this month.'
                    }, status=400)
        except Exception:
            pass

        # Overlap check
        overlap = LeaveRequest.objects.filter(
            employee=request.user,
            status__in=['pending', 'approved'],
            start_date__lte=end,
            end_date__gte=start,
        ).exists()

        if overlap:
            return Response(
                {'error': 'You already have a leave request overlapping these dates'},
                status=400,
            )

        leave = LeaveRequest.objects.create(
            employee=request.user,
            leave_type=lt,
            start_date=start,
            end_date=end,
            days=days,
            session=session,
            reason=reason,
            doc_url=request.data.get('doc_url', ''),
        )

        balance.pending += days
        balance.save()

        return Response(LeaveRequestSerializer(leave).data, status=status.HTTP_201_CREATED)


# ── MY LEAVE REQUESTS ─────────────────────────────────────────────────────────

class MyLeaveRequestsView(APIView):
    permission_classes = [make_permission('view_leave')]

    def get(self, request):
        status_filter = request.query_params.get('status')
        qs = LeaveRequest.objects.filter(
            employee=request.user
        ).select_related('leave_type', 'approved_by')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(LeaveRequestSerializer(qs, many=True).data)


# ── CANCEL LEAVE ──────────────────────────────────────────────────────────────

class CancelLeaveView(APIView):
    permission_classes = [make_permission('cancel_leave')]

    def post(self, request, pk):
        leave = get_object_or_404(LeaveRequest, pk=pk, employee=request.user)

        if leave.status not in ['pending', 'approved']:
            return Response({'error': f'Cannot cancel a {leave.status} request'}, status=400)

        if leave.status == 'approved' and leave.start_date <= date.today():
            return Response({'error': 'Cannot cancel leave that has already started'}, status=400)

        old_status   = leave.status
        leave.status = 'cancelled'
        leave.save()

        year = leave.start_date.year
        try:
            balance = LeaveBalance.objects.get(
                employee=request.user, leave_type=leave.leave_type, year=year
            )
            if old_status == 'pending':
                balance.pending = max(balance.pending - leave.days, 0)
            elif old_status == 'approved':
                balance.used = max(balance.used - leave.days, 0)
            balance.save()
        except LeaveBalance.DoesNotExist:
            pass

        if old_status == 'approved':
            from datetime import timedelta
            from attendance.models import AttendanceRecord
            cur = leave.start_date
            while cur <= leave.end_date:
                from attendance.settings_helper import is_weekend as _is_wknd
                if not _is_wknd(cur):
                    AttendanceRecord.objects.filter(
                        employee=leave.employee, date=cur,
                    ).update(status='absent', note='Leave cancelled — marked absent')
                cur += timedelta(days=1)

        return Response({'message': 'Leave request cancelled successfully'})


# ── ALL LEAVE REQUESTS (Manager/HR/Admin) ─────────────────────────────────────

class AllLeaveRequestsView(APIView):
    permission_classes = [make_permission('view_all_leave')]

    def get(self, request):
        status_filter = request.query_params.get('status')
        emp_id        = request.query_params.get('employee')

        qs = LeaveRequest.objects.select_related(
            'employee', 'employee__profile', 'leave_type', 'approved_by'
        ).all()

        # KEY FIX: exclude the logged-in user's OWN requests from the approval queue.
        # If HR applies leave, it must NOT appear in HR's approval list —
        # only in manager/admin/higher-level approver's queue.
        qs = qs.exclude(employee=request.user)

        if status_filter:
            qs = qs.filter(status=status_filter)
        if emp_id:
            qs = qs.filter(employee_id=emp_id)

        return Response(LeaveRequestSerializer(qs, many=True).data)

# ── APPROVE / REJECT ──────────────────────────────────────────────────────────

class LeaveActionView(APIView):
    permission_classes = [make_permission('approve_leave')]

    def post(self, request, pk):
        action = request.data.get('action')
        note   = request.data.get('note', '')

        if action not in ['approve', 'reject']:
            return Response({'error': 'action must be approve or reject'}, status=400)

        leave = get_object_or_404(
            LeaveRequest.objects.select_related('leave_type', 'employee'), pk=pk
        )

        if leave.status != 'pending':
            return Response({'error': f'Request is already {leave.status}'}, status=400)

        leave.status       = 'approved' if action == 'approve' else 'rejected'
        leave.approved_by  = request.user
        leave.approver_note = note
        leave.save()

        try:
            from notifications.utils import notify_leave_actioned
            notify_leave_actioned(leave, action, request.user)
        except Exception as e:
            print('Leave action notification error:', e)

        year = leave.start_date.year
        try:
            balance = LeaveBalance.objects.get(
                employee=leave.employee, leave_type=leave.leave_type, year=year
            )
            balance.pending = max(balance.pending - leave.days, 0)
            if action == 'approve':
                balance.used += leave.days
            balance.save()
        except LeaveBalance.DoesNotExist:
            pass

        if action == 'approve':
            from datetime import timedelta
            from attendance.models import AttendanceRecord
            from attendance.settings_helper import is_weekend as _is_wknd

            is_unpaid = (not leave.leave_type.is_paid) or (leave.leave_type.code == 'LOP')
            is_half   = leave.session in ('first_half', 'second_half')
            att_status = 'half_day' if is_half else ('absent' if is_unpaid else 'leave')

            cur = leave.start_date
            while cur <= leave.end_date:
                if not _is_wknd(cur):
                    AttendanceRecord.objects.update_or_create(
                        employee=leave.employee, date=cur,
                        defaults={'status': att_status, 'note': f'Leave approved: {leave.leave_type.name}'},
                    )
                cur += timedelta(days=1)

        if action == 'reject':
            from datetime import timedelta
            from attendance.models import AttendanceRecord
            from attendance.settings_helper import is_weekend as _is_wknd

            is_half    = leave.session in ('first_half', 'second_half')
            att_status = 'half_day' if is_half else 'absent'

            cur = leave.start_date
            while cur <= leave.end_date:
                if not _is_wknd(cur):
                    AttendanceRecord.objects.update_or_create(
                        employee=leave.employee, date=cur,
                        defaults={'status': att_status, 'note': f'Leave rejected: {leave.leave_type.name}'},
                    )
                cur += timedelta(days=1)

        return Response({
            'message': f'Leave {leave.status}',
            'data': LeaveRequestSerializer(leave).data,
        })


# ── PRIOR USAGE CHECK ─────────────────────────────────────────────────────────

class LeavePriorUsageView(APIView):
    permission_classes = [make_permission('approve_leave')]

    def get(self, request, pk):
        leave = get_object_or_404(
            LeaveRequest.objects.select_related('employee', 'leave_type'), pk=pk
        )
        month      = leave.start_date.month
        year       = leave.start_date.year
        employee   = leave.employee
        leave_type = leave.leave_type

        prior_qs = LeaveRequest.objects.filter(
            employee=employee, leave_type=leave_type,
            start_date__year=year, start_date__month=month,
            status__in=['approved', 'pending'],
        ).exclude(pk=pk).order_by('start_date')

        prior_approved = [r for r in prior_qs if r.status == 'approved']
        prior_pending  = [r for r in prior_qs if r.status == 'pending']

        def fmt(r):
            return {
                'id': r.id, 'start_date': str(r.start_date),
                'end_date': str(r.end_date), 'days': float(r.days),
                'status': r.status, 'applied_at': r.applied_at.strftime('%d %b %Y'),
            }

        total_prior_days = sum(float(r.days) for r in prior_qs)

        try:
            balance = LeaveBalance.objects.get(employee=employee, leave_type=leave_type, year=year)
            annual_balance = {
                'total': float(balance.total), 'used': float(balance.used),
                'pending': float(balance.pending), 'remaining': float(balance.remaining),
                'carried': float(balance.carried or 0),
            }
        except LeaveBalance.DoesNotExist:
            annual_balance = None

        import calendar
        return Response({
            'employee_name':    employee.get_full_name() or employee.username,
            'leave_type':       leave_type.name,
            'month':            f'{calendar.month_name[month]} {year}',
            'requested_days':   float(leave.days),
            'prior_approved':   [fmt(r) for r in prior_approved],
            'prior_pending':    [fmt(r) for r in prior_pending],
            'total_prior_days': total_prior_days,
            'annual_balance':   annual_balance,
            'has_prior':        total_prior_days > 0,
        })