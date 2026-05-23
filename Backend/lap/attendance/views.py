# attendance/views.py
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics

from utils.permissions import make_permission, IsAuthenticatedUser
from accounts.models import User
from .models import AttendanceRecord, AttendanceRegularization, Holiday
from .serializers import (
    AttendanceRecordSerializer,
    RegularizationSerializer,
    HolidaySerializer,
)

STANDARD_HOURS  = Decimal('8.0')
GRACE_MINUTES   = 15
SHIFT_START     = time(9, 0)   # 9:00 AM


def _get_status(check_in, check_out, hours_worked):
    """Determine attendance status from times."""
    if not check_in:
        return 'absent'
    grace = datetime.combine(date.today(), SHIFT_START) + timedelta(minutes=GRACE_MINUTES)
    ci    = datetime.combine(date.today(), check_in)
    if hours_worked < Decimal('4.0'):
        return 'half_day'
    if ci > grace:
        return 'late'
    return 'present'


# ── CHECK-IN ──────────────────────────────────────────────────────────────────

class CheckInView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        today    = date.today()
        is_wfh   = request.data.get('is_wfh', False)
        now_time = datetime.now().time()

        # Check if already checked in today
        existing = AttendanceRecord.objects.filter(
            employee=request.user, date=today
        ).first()

        if existing and existing.check_in:
            return Response(
                {'error': 'Already checked in today'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if existing:
            existing.check_in = now_time
            existing.is_wfh   = is_wfh
            existing.status   = 'present'
            existing.save()
            record = existing
        else:
            record = AttendanceRecord.objects.create(
                employee  = request.user,
                date      = today,
                check_in  = now_time,
                is_wfh    = is_wfh,
                status    = 'present',
            )

        return Response({
            'message':  'Checked in successfully',
            'check_in': str(now_time.strftime('%H:%M')),
            'is_wfh':   is_wfh,
            'record':   AttendanceRecordSerializer(record).data,
        })


# ── CHECK-OUT ─────────────────────────────────────────────────────────────────

class CheckOutView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        today    = date.today()
        now_time = datetime.now().time()

        record = AttendanceRecord.objects.filter(
            employee=request.user, date=today
        ).first()

        if not record or not record.check_in:
            return Response(
                {'error': 'No check-in found for today. Please check in first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if record.check_out:
            return Response(
                {'error': 'Already checked out today'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate hours
        ci      = datetime.combine(today, record.check_in)
        co      = datetime.combine(today, now_time)
        diff    = Decimal(str(round((co - ci).total_seconds() / 3600, 2)))
        ot      = max(diff - STANDARD_HOURS, Decimal('0'))

        record.check_out    = now_time
        record.hours_worked = diff
        record.ot_hours     = ot
        record.status       = _get_status(record.check_in, now_time, diff)
        record.save()

        return Response({
            'message':      'Checked out successfully',
            'check_out':    str(now_time.strftime('%H:%M')),
            'hours_worked': float(diff),
            'ot_hours':     float(ot),
            'status':       record.status,
            'record':       AttendanceRecordSerializer(record).data,
        })


# ── TODAY STATUS ──────────────────────────────────────────────────────────────

class TodayAttendanceView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        today  = date.today()
        record = AttendanceRecord.objects.filter(
            employee=request.user, date=today
        ).first()

        if not record:
            return Response({
                'date':         str(today),
                'checked_in':   False,
                'checked_out':  False,
                'check_in':     None,
                'check_out':    None,
                'hours_worked': 0,
                'status':       'not_started',
                'is_wfh':       False,
            })

        return Response({
            'date':         str(today),
            'checked_in':   bool(record.check_in),
            'checked_out':  bool(record.check_out),
            'check_in':     record.check_in.strftime('%H:%M') if record.check_in  else None,
            'check_out':    record.check_out.strftime('%H:%M') if record.check_out else None,
            'hours_worked': float(record.hours_worked),
            'status':       record.status,
            'is_wfh':       record.is_wfh,
        })


# ── MY MONTHLY RECORDS ────────────────────────────────────────────────────────

class MyAttendanceView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        month = int(request.query_params.get('month', date.today().month))
        year  = int(request.query_params.get('year',  date.today().year))

        records = AttendanceRecord.objects.filter(
            employee=request.user,
            date__year=year,
            date__month=month,
        ).order_by('date')

        holidays = Holiday.objects.filter(
            date__year=year, date__month=month
        ).values('date', 'name')

        # Summary counts
        summary = {
            'present':  records.filter(status='present').count(),
            'absent':   records.filter(status='absent').count(),
            'late':     records.filter(status='late').count(),
            'half_day': records.filter(status='half_day').count(),
            'leave':    records.filter(status='leave').count(),
            'total_hours': float(
                sum(r.hours_worked for r in records if r.hours_worked)
            ),
            'total_ot': float(
                sum(r.ot_hours for r in records if r.ot_hours)
            ),
        }

        return Response({
            'month':     month,
            'year':      year,
            'summary':   summary,
            'records':   AttendanceRecordSerializer(records, many=True).data,
            'holidays':  list(holidays),
        })


# ── ALL EMPLOYEES ATTENDANCE (Manager/HR/Admin) ───────────────────────────────

class AllAttendanceView(APIView):
    permission_classes = [make_permission('view_team_attendance')]

    def get(self, request):
        month = int(request.query_params.get('month', date.today().month))
        year  = int(request.query_params.get('year',  date.today().year))
        emp_id = request.query_params.get('employee')

        records = AttendanceRecord.objects.select_related(
            'employee', 'employee__profile'
        ).filter(
            date__year=year, date__month=month
        )

        if emp_id:
            records = records.filter(employee_id=emp_id)

        return Response(AttendanceRecordSerializer(records, many=True).data)


# ── REGULARIZATION — APPLY ────────────────────────────────────────────────────

class ApplyRegularizationView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        record_id        = request.data.get('attendance_id')
        reason           = request.data.get('reason', '').strip()
        req_checkin      = request.data.get('requested_checkin')
        req_checkout     = request.data.get('requested_checkout')
        target_date_str  = request.data.get('date')   # NEW — allow date without record_id

        if not reason:
            return Response(
                {'error': 'reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Resolve record — either by ID or by date
        if record_id:
            try:
                record = AttendanceRecord.objects.get(
                    id=record_id, employee=request.user
                )
            except AttendanceRecord.DoesNotExist:
                return Response({'error': 'Record not found'}, status=404)

        elif target_date_str:
            # Parse date
            try:
                from datetime import date as date_type
                target_date = date_type.fromisoformat(target_date_str)
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)

            # Auto-create record for that date if missing
            record, created = AttendanceRecord.objects.get_or_create(
                employee=request.user,
                date=target_date,
                defaults={'status': 'absent'},
            )
        else:
            return Response(
                {'error': 'Either attendance_id or date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Block if attendance is locked (payroll processed)
        if record.is_locked:
            return Response(
                {'error': 'Attendance is locked for this date. Cannot regularize.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Block if regularization already submitted for this record
        if hasattr(record, 'regularization'):
            existing = record.regularization
            if existing.status == 'pending':
                return Response(
                    {'error': 'A pending regularization already exists for this date.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # If previously rejected, delete old one and allow re-submission
            if existing.status == 'rejected':
                existing.delete()

        reg = AttendanceRegularization.objects.create(
            attendance         = record,
            employee           = request.user,
            reason             = reason,
            requested_checkin  = req_checkin  or None,
            requested_checkout = req_checkout or None,
        )

        return Response(
            RegularizationSerializer(reg).data,
            status=status.HTTP_201_CREATED
        )

# ── REGULARIZATION — MY LIST ──────────────────────────────────────────────────

class MyRegularizationsView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        regs = AttendanceRegularization.objects.filter(
            employee=request.user
        ).select_related('attendance', 'approved_by')
        return Response(RegularizationSerializer(regs, many=True).data)


# ── REGULARIZATION — ALL (Manager/HR) ─────────────────────────────────────────

class AllRegularizationsView(APIView):
    permission_classes = [make_permission('approve_regularize')]

    def get(self, request):
        status_filter = request.query_params.get('status', 'pending')
        regs = AttendanceRegularization.objects.filter(
            status=status_filter
        ).select_related('attendance', 'employee', 'employee__profile', 'approved_by')
        return Response(RegularizationSerializer(regs, many=True).data)


# ── REGULARIZATION — APPROVE / REJECT ────────────────────────────────────────

class ApproveRegularizationView(APIView):
    permission_classes = [make_permission('approve_regularize')]

    def post(self, request, pk):
        action = request.data.get('action')   # 'approve' or 'reject'
        note   = request.data.get('note', '')

        if action not in ['approve', 'reject']:
            return Response({'error': 'action must be approve or reject'}, status=400)

        try:
            reg = AttendanceRegularization.objects.select_related(
                'attendance'
            ).get(pk=pk)
        except AttendanceRegularization.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if reg.status != 'pending':
            return Response(
                {'error': f'Already {reg.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reg.status        = 'approved' if action == 'approve' else 'rejected'
        reg.approved_by   = request.user
        reg.approver_note = note
        reg.save()

        # If approved, update the attendance record
        if action == 'approve':
            record = reg.attendance
            if reg.requested_checkin:
                record.check_in = reg.requested_checkin
            if reg.requested_checkout:
                record.check_out = reg.requested_checkout
            if record.check_in and record.check_out:
                ci   = datetime.combine(date.today(), record.check_in)
                co   = datetime.combine(date.today(), record.check_out)
                diff = Decimal(str(round((co - ci).total_seconds() / 3600, 2)))
                record.hours_worked = diff
                record.ot_hours     = max(diff - STANDARD_HOURS, Decimal('0'))
                record.status       = _get_status(record.check_in, record.check_out, diff)
            record.save()

        return Response({
            'message': f'Regularization {reg.status}',
            'data':    RegularizationSerializer(reg).data,
        })


# ── HOLIDAYS ──────────────────────────────────────────────────────────────────

class HolidayListView(generics.ListCreateAPIView):
    queryset         = Holiday.objects.all()
    serializer_class = HolidaySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticatedUser()]
        return [make_permission('manage_settings')()]