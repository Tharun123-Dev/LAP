from django.shortcuts import render
from decimal import Decimal
# Create your views here.
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
from .utils import count_working_days, get_or_create_balance, init_balances_for_employee


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

        # Auto-init if no balances exist
        count = LeaveBalance.objects.filter(
            employee=request.user, year=year
        ).count()
        if count == 0:
            init_balances_for_employee(request.user, year)

        balances = LeaveBalance.objects.filter(
            employee=request.user, year=year
        ).select_related('leave_type')

        return Response(LeaveBalanceSerializer(balances, many=True).data)


class InitBalanceView(APIView):
    """Admin manually initialises balances for a specific employee."""
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


# ── APPLY LEAVE ───────────────────────────────────────────────────────────────

class ApplyLeaveView(APIView):
    permission_classes = [make_permission('apply_leave')]

    def post(self, request):
        lt_id      = request.data.get('leave_type')
        start_str  = request.data.get('start_date')
        end_str    = request.data.get('end_date')
        session    = request.data.get('session', 'full')
        reason     = request.data.get('reason', '').strip()

        # Validate required fields
        if not all([lt_id, start_str, end_str, reason]):
            return Response(
                {'error': 'leave_type, start_date, end_date, reason are required'},
                status=400
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

        # Notice period check
        if lt.min_notice_days > 0:
            if (start - date.today()).days < lt.min_notice_days:
                return Response({
                    'error': f'{lt.name} requires {lt.min_notice_days} day(s) advance notice'
                }, status=400)

        # Calculate days
        days = count_working_days(start, end, session)

        # Balance check
        year    = date.today().year
        balance = get_or_create_balance(request.user, lt, year)

        if balance.remaining < days:
            return Response({
                'error': f'Insufficient balance. Available: {balance.remaining} days, Requested: {days} days'
            }, status=400)

        # Check overlapping leave
        overlap = LeaveRequest.objects.filter(
            employee   = request.user,
            status__in = ['pending', 'approved'],
            start_date__lte = end,
            end_date__gte   = start,
        ).exists()

        if overlap:
            return Response(
                {'error': 'You already have a leave request overlapping these dates'},
                status=400
            )

        # Create request + hold balance
        leave = LeaveRequest.objects.create(
            employee   = request.user,
            leave_type = lt,
            start_date = start,
            end_date   = end,
            days       = days,
            session    = session,
            reason     = reason,
            doc_url    = request.data.get('doc_url', ''),
        )

        balance.pending += Decimal(str(days))
        balance.save()

        return Response(
            LeaveRequestSerializer(leave).data,
            status=status.HTTP_201_CREATED
        )


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
            return Response(
                {'error': f'Cannot cancel a {leave.status} request'},
                status=400
            )

        if leave.status == 'approved' and leave.start_date <= date.today():
            return Response(
                {'error': 'Cannot cancel leave that has already started'},
                status=400
            )

        old_status = leave.status
        leave.status = 'cancelled'
        leave.save()

        # Release balance
        year    = leave.start_date.year
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

        # Revert attendance written on approval: mark those days absent
        # so payroll sees them as LOP (leave is void, employee didn't work).
        if old_status == 'approved':
            from datetime import timedelta
            from attendance.models import AttendanceRecord
            current = leave.start_date
            while current <= leave.end_date:
                if current.weekday() < 5:
                    AttendanceRecord.objects.filter(
                        employee=leave.employee,
                        date=current,
                    ).update(status='absent', note='Leave cancelled — marked absent')
                current += timedelta(days=1)

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

        if status_filter:
            qs = qs.filter(status=status_filter)
        if emp_id:
            qs = qs.filter(employee_id=emp_id)

        return Response(LeaveRequestSerializer(qs, many=True).data)


# ── APPROVE / REJECT ──────────────────────────────────────────────────────────
# ── APPROVE / REJECT ──────────────────────────────────────────────────────────

class LeaveActionView(APIView):
    permission_classes = [make_permission('approve_leave')]

    def post(self, request, pk):

        action = request.data.get('action')
        note   = request.data.get('note', '')

        if action not in ['approve', 'reject']:
            return Response(
                {'error': 'action must be approve or reject'},
                status=400
            )

        leave = get_object_or_404(
            LeaveRequest.objects.select_related(
                'leave_type',
                'employee'
            ),
            pk=pk
        )

        if leave.status != 'pending':
            return Response(
                {'error': f'Request is already {leave.status}'},
                status=400
            )

        # Update leave status
        leave.status = (
            'approved'
            if action == 'approve'
            else 'rejected'
        )

        leave.approved_by   = request.user
        leave.approver_note = note

        leave.save()

        # ── NOTIFICATION ─────────────────────────────────────
        try:
            from notifications.utils import notify_leave_actioned

            notify_leave_actioned(
                leave,
                action,
                request.user
            )

        except Exception as e:
            print("Leave action notification error:", e)

        # ── UPDATE BALANCE ───────────────────────────────────
        year = leave.start_date.year

        try:
            balance = LeaveBalance.objects.get(
                employee=leave.employee,
                leave_type=leave.leave_type,
                year=year
            )

            balance.pending = max(
                balance.pending - leave.days,
                0
            )

            if action == 'approve':
                balance.used += Decimal(str(leave.days))

            balance.save()

        except LeaveBalance.DoesNotExist:
            pass

        # ── MARK ATTENDANCE ON APPROVAL ─────────────────────
        if action == 'approve':

            from datetime import timedelta
            from attendance.models import AttendanceRecord

            is_unpaid = (
                not leave.leave_type.is_paid or
                leave.leave_type.code == 'LOP'
            )

            is_half = leave.session in (
                'first_half',
                'second_half'
            )

            if is_half:
                att_status = 'half_day'

            elif is_unpaid:
                att_status = 'absent'

            else:
                att_status = 'leave'

            note_text = (
                f'Leave approved: {leave.leave_type.name}'
            )

            current = leave.start_date

            while current <= leave.end_date:

                if current.weekday() < 5:

                    AttendanceRecord.objects.update_or_create(
                        employee=leave.employee,
                        date=current,

                        defaults={
                            'status': att_status,
                            'note': note_text,
                        }
                    )

                current += timedelta(days=1)

        # ── MARK ABSENT ON REJECTION ────────────────────────
        if action == 'reject':

            from datetime import timedelta
            from attendance.models import AttendanceRecord

            is_half = leave.session in (
                'first_half',
                'second_half'
            )

            att_status = (
                'half_day'
                if is_half
                else 'absent'
            )

            current = leave.start_date

            while current <= leave.end_date:

                if current.weekday() < 5:

                    AttendanceRecord.objects.update_or_create(
                        employee=leave.employee,
                        date=current,

                        defaults={
                            'status': att_status,
                            'note': f'Leave rejected: {leave.leave_type.name} — marked absent',
                        }
                    )

                current += timedelta(days=1)

        return Response({
            'message': f'Leave {leave.status}',
            'data': LeaveRequestSerializer(leave).data,
        })


# ── PRIOR USAGE CHECK (for approver confirmation popup) ──────────────────────

class LeavePriorUsageView(APIView):
    """
    GET /api/leave/<pk>/prior-usage/

    Called by the approver UI before clicking Approve.
    Returns how many days of the SAME leave type the employee has already
    taken (approved + pending) in the SAME calendar month as this request.

    Response:
    {
        "employee_name": "...",
        "leave_type": "Casual Leave",
        "month": "May 2026",
        "requested_days": 2.0,
        "prior_approved": [
            {"id": 5, "start_date": "2026-05-01", "end_date": "2026-05-02",
             "days": 2.0, "status": "approved", "applied_at": "..."}
        ],
        "prior_pending": [...],
        "total_prior_days": 2.0,
        "annual_balance": {"total": 12, "used": 2, "pending": 2, "remaining": 8},
        "has_prior": true
    }
    """
    permission_classes = [make_permission('approve_leave')]

    def get(self, request, pk):
        leave = get_object_or_404(
            LeaveRequest.objects.select_related('employee', 'leave_type'),
            pk=pk
        )

        month      = leave.start_date.month
        year       = leave.start_date.year
        employee   = leave.employee
        leave_type = leave.leave_type

        # All OTHER requests of the same type this month (exclude self)
        prior_qs = LeaveRequest.objects.filter(
            employee   = employee,
            leave_type = leave_type,
            start_date__year  = year,
            start_date__month = month,
            status__in        = ['approved', 'pending'],
        ).exclude(pk=pk).order_by('start_date')

        prior_approved = [r for r in prior_qs if r.status == 'approved']
        prior_pending  = [r for r in prior_qs if r.status == 'pending']

        def fmt(r):
            return {
                'id':         r.id,
                'start_date': str(r.start_date),
                'end_date':   str(r.end_date),
                'days':       float(r.days),
                'status':     r.status,
                'applied_at': r.applied_at.strftime('%d %b %Y'),
            }

        total_prior_days = sum(float(r.days) for r in prior_qs)

        # Annual balance snapshot
        try:
            balance = LeaveBalance.objects.get(
                employee=employee, leave_type=leave_type, year=year
            )
            annual_balance = {
                'total':     float(balance.total),
                'used':      float(balance.used),
                'pending':   float(balance.pending),
                'remaining': float(balance.remaining),
            }
        except LeaveBalance.DoesNotExist:
            annual_balance = None

        import calendar
        month_name = f"{calendar.month_name[month]} {year}"

        return Response({
            'employee_name':    employee.get_full_name() or employee.username,
            'leave_type':       leave_type.name,
            'month':            month_name,
            'requested_days':   float(leave.days),
            'prior_approved':   [fmt(r) for r in prior_approved],
            'prior_pending':    [fmt(r) for r in prior_pending],
            'total_prior_days': total_prior_days,
            'annual_balance':   annual_balance,
            'has_prior':        total_prior_days > 0,
        })