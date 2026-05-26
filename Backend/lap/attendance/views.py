# attendance/views.py
from datetime import date, datetime, time, timedelta
from decimal import Decimal
import calendar as cal_mod

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics

from utils.permissions import make_permission, IsAuthenticatedUser
from accounts.models import User
from .models import AttendanceRecord, AttendanceRegularization, Holiday, OfficeLocation
from .serializers import (
    AttendanceRecordSerializer,
    RegularizationSerializer,
    HolidaySerializer,
    OfficeLocationSerializer,
)
from .settings_helper import (
    get_shift_start,
    get_grace_minutes,
    get_standard_hours,
    get_half_day_hours,
)


def _get_status(check_in, check_out, hours_worked):
    """
    Determine attendance status — reads ALL thresholds live from SystemSetting.
    Grace period, shift start, half-day hours — all from DB, never hardcoded.
    """
    if not check_in:
        return 'absent'
    if not check_out:
        return 'half_day'

    shift_start    = get_shift_start()
    grace_minutes  = get_grace_minutes()
    half_day_hours = Decimal(str(get_half_day_hours()))

    grace_cutoff = datetime.combine(date.today(), shift_start) + timedelta(minutes=grace_minutes)
    ci           = datetime.combine(date.today(), check_in)

    if hours_worked < half_day_hours:
        return 'half_day'
    if ci > grace_cutoff:
        return 'late'
    return 'present'


def _validate_location(lat, lon):
    """
    Check whether the given GPS point is within the allowed radius of the
    active office location.

    Returns (ok: bool, distance_m: float, office: OfficeLocation | None, error_msg: str | None)
    """
    office = OfficeLocation.active()

    # If no office location is configured → allow (don't block employees)
    if office is None:
        return True, None, None, None

    if lat is None or lon is None:
        return False, None, office, 'Location is required for check-in/check-out. Please allow location access.'

    try:
        distance_m = office.distance_from(float(lat), float(lon))
    except (ValueError, TypeError):
        return False, None, office, 'Invalid location data sent.'

    if distance_m > office.radius_meters:
        return (
            False,
            round(distance_m, 1),
            office,
            f'You are {round(distance_m, 0):.0f} m away from the office. '
            f'Check-in is only allowed within {office.radius_meters} m.'
        )

    return True, round(distance_m, 1), office, None


# ── OFFICE LOCATION (admin CRUD) ──────────────────────────────────────────────

class OfficeLocationView(APIView):
    """
    GET  /attendance/office-location/  — returns active office location (all users)
    POST /attendance/office-location/  — create / update office location (admin only)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticatedUser()]
        return [make_permission('manage_settings')()]

    def get(self, request):
        office = OfficeLocation.active()
        if not office:
            return Response({'detail': 'No office location configured.'}, status=404)
        return Response(OfficeLocationSerializer(office).data)

    def post(self, request):
        """
        Creates a new active location and deactivates all previous ones,
        OR updates existing active one in-place.
        """
        name          = request.data.get('name', 'Head Office')
        latitude      = request.data.get('latitude')
        longitude     = request.data.get('longitude')
        radius_meters = request.data.get('radius_meters', 300)

        if latitude is None or longitude is None:
            return Response(
                {'error': 'latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Deactivate all existing
        OfficeLocation.objects.filter(is_active=True).update(is_active=False)

        office = OfficeLocation.objects.create(
            name          = name,
            latitude      = latitude,
            longitude     = longitude,
            radius_meters = radius_meters,
            is_active     = True,
        )

        return Response(OfficeLocationSerializer(office).data, status=status.HTTP_201_CREATED)


# ── CHECK-IN ──────────────────────────────────────────────────────────────────

class CheckInView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        today    = date.today()
        is_wfh   = request.data.get('is_wfh', False)
        now_time = datetime.now().time()

        # ── Location validation (skip for WFH) ───────────────────────────────
        if not is_wfh:
            lat = request.data.get('latitude')
            lon = request.data.get('longitude')
            ok, distance_m, office, error_msg = _validate_location(lat, lon)
            if not ok:
                return Response(
                    {
                        'error':      error_msg,
                        'distance_m': distance_m,
                        'allowed_radius': office.radius_meters if office else None,
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            lat, lon, distance_m = None, None, None

        existing = AttendanceRecord.objects.filter(
            employee=request.user, date=today
        ).first()

        if existing and existing.check_in:
            return Response(
                {'error': 'Already checked in today'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if existing:
            existing.check_in            = now_time
            existing.is_wfh              = is_wfh
            existing.status              = 'half_day'
            existing.note                = 'Checked in — awaiting checkout'
            existing.checkin_latitude    = lat
            existing.checkin_longitude   = lon
            existing.checkin_distance_m  = distance_m
            existing.save()
            record = existing
        else:
            record = AttendanceRecord.objects.create(
                employee            = request.user,
                date                = today,
                check_in            = now_time,
                is_wfh              = is_wfh,
                status              = 'half_day',
                note                = 'Checked in — awaiting checkout',
                checkin_latitude    = lat,
                checkin_longitude   = lon,
                checkin_distance_m  = distance_m,
            )

        return Response({
            'message':     'Checked in successfully',
            'check_in':    str(now_time.strftime('%H:%M')),
            'is_wfh':      is_wfh,
            'distance_m':  distance_m,
            'record':      AttendanceRecordSerializer(record).data,
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

        # ── Location validation (skip for WFH) ───────────────────────────────
        if not record.is_wfh:
            lat = request.data.get('latitude')
            lon = request.data.get('longitude')
            ok, distance_m, office, error_msg = _validate_location(lat, lon)
            if not ok:
                return Response(
                    {
                        'error':          error_msg,
                        'distance_m':     distance_m,
                        'allowed_radius': office.radius_meters if office else None,
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            lat, lon, distance_m = None, None, None

        standard_hours = Decimal(str(get_standard_hours()))

        ci   = datetime.combine(today, record.check_in)
        co   = datetime.combine(today, now_time)
        diff = Decimal(str(round((co - ci).total_seconds() / 3600, 2)))
        ot   = max(diff - standard_hours, Decimal('0'))

        record.check_out             = now_time
        record.hours_worked          = diff
        record.ot_hours              = ot
        record.status                = _get_status(record.check_in, now_time, diff)
        record.checkout_latitude     = lat
        record.checkout_longitude    = lon
        record.checkout_distance_m   = distance_m
        if 'awaiting checkout' in (record.note or '').lower():
            record.note = ''
        record.save()

        return Response({
            'message':      'Checked out successfully',
            'check_out':    str(now_time.strftime('%H:%M')),
            'hours_worked': float(diff),
            'ot_hours':     float(ot),
            'status':       record.status,
            'distance_m':   distance_m,
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
            'date':                str(today),
            'checked_in':          bool(record.check_in),
            'checked_out':         bool(record.check_out),
            'check_in':            record.check_in.strftime('%H:%M')  if record.check_in  else None,
            'check_out':           record.check_out.strftime('%H:%M') if record.check_out else None,
            'hours_worked':        float(record.hours_worked),
            'status':              record.status,
            'is_wfh':              record.is_wfh,
            'checkin_distance_m':  record.checkin_distance_m,
            'checkout_distance_m': record.checkout_distance_m,
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

        from leave.models import LeaveRequest
        approved_leaves = LeaveRequest.objects.filter(
            employee=request.user,
            status='approved',
            start_date__lte=date(year, month, cal_mod.monthrange(year, month)[1]),
            end_date__gte=date(year, month, 1),
        ).select_related('leave_type')

        leave_dates = {}
        for lr in approved_leaves:
            is_lop = (not lr.leave_type.is_paid) or (lr.leave_type.code == 'LOP')
            cur = lr.start_date
            while cur <= lr.end_date:
                if cur.year == year and cur.month == month:
                    leave_dates[str(cur)] = {'name': lr.leave_type.name, 'is_lop': is_lop}
                cur += timedelta(days=1)

        holidays = Holiday.objects.filter(
            date__year=year, date__month=month
        ).values('date', 'name')

        record_map = {str(r.date): r for r in records}
        serialized = list(AttendanceRecordSerializer(records, many=True).data)

        today_str = str(date.today())

        for rec in serialized:
            if rec.get('check_in') and not rec.get('check_out') and rec.get('date') != today_str:
                rec['status'] = 'half_day'

        existing_dates = set(record_map.keys())

        for date_str, leave_info in leave_dates.items():
            leave_status = 'lop_leave' if leave_info['is_lop'] else 'leave'

            if date_str not in existing_dates:
                serialized.append({
                    'id':           None,
                    'date':         date_str,
                    'check_in':     None,
                    'check_out':    None,
                    'hours_worked': 0,
                    'ot_hours':     0,
                    'status':       leave_status,
                    'is_wfh':       False,
                    'leave_name':   leave_info['name'],
                    'is_lop':       leave_info['is_lop'],
                })
            else:
                for rec in serialized:
                    if rec.get('date') == date_str:
                        if rec.get('status') in ('absent', 'leave', 'not_started'):
                            rec['status'] = leave_status
                        rec['leave_name'] = leave_info['name']
                        rec['is_lop']     = leave_info['is_lop']
                        break

        status_counts = {}
        for rec in serialized:
            st = rec.get('status', 'absent')
            status_counts[st] = status_counts.get(st, 0) + 1

        summary = {
            'present':     status_counts.get('present', 0) + status_counts.get('late', 0),
            'absent':      status_counts.get('absent', 0),
            'late':        status_counts.get('late', 0),
            'half_day':    status_counts.get('half_day', 0),
            'leave':       status_counts.get('leave', 0),
            'lop_leave':   status_counts.get('lop_leave', 0),
            'total_hours': float(sum(r.hours_worked for r in records if r.hours_worked)),
            'total_ot':    float(sum(r.ot_hours     for r in records if r.ot_hours)),
        }

        shift_start   = get_shift_start()
        grace_minutes = get_grace_minutes()
        late_cutoff   = (
            datetime.combine(date.today(), shift_start) +
            timedelta(minutes=grace_minutes)
        ).strftime('%H:%M')

        return Response({
            'month':    month,
            'year':     year,
            'summary':  summary,
            'records':  serialized,
            'holidays': list(holidays),
            'policy': {
                'shift_start':   shift_start.strftime('%H:%M'),
                'grace_minutes': grace_minutes,
                'late_cutoff':   late_cutoff,
            },
        })


# ── ALL EMPLOYEES ATTENDANCE (Manager/HR/Admin) ───────────────────────────────

class AllAttendanceView(APIView):
    permission_classes = [make_permission('view_team_attendance')]

    def get(self, request):
        month  = int(request.query_params.get('month', date.today().month))
        year   = int(request.query_params.get('year',  date.today().year))
        emp_id = request.query_params.get('employee')

        records = AttendanceRecord.objects.select_related(
            'employee', 'employee__profile'
        ).filter(date__year=year, date__month=month)

        if emp_id:
            records = records.filter(employee_id=emp_id)

        return Response(AttendanceRecordSerializer(records, many=True).data)


# ── REGULARIZATION — APPLY ────────────────────────────────────────────────────

class ApplyRegularizationView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        record_id       = request.data.get('attendance_id')
        reason          = request.data.get('reason', '').strip()
        req_checkin     = request.data.get('requested_checkin')
        req_checkout    = request.data.get('requested_checkout')
        target_date_str = request.data.get('date')

        if not reason:
            return Response({'error': 'reason is required'}, status=status.HTTP_400_BAD_REQUEST)

        if record_id:
            try:
                record = AttendanceRecord.objects.get(id=record_id, employee=request.user)
            except AttendanceRecord.DoesNotExist:
                return Response({'error': 'Record not found'}, status=404)

        elif target_date_str:
            try:
                target_date = date.fromisoformat(target_date_str)
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
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

        if record.is_locked:
            return Response(
                {'error': 'Attendance is locked for this date. Cannot regularize.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if hasattr(record, 'regularization'):
            existing = record.regularization
            if existing.status == 'pending':
                return Response(
                    {'error': 'A pending regularization already exists for this date.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if existing.status == 'rejected':
                existing.delete()

        reg = AttendanceRegularization.objects.create(
            attendance         = record,
            employee           = request.user,
            reason             = reason,
            requested_checkin  = req_checkin or None,
            requested_checkout = req_checkout or None,
        )

        try:
            from notifications.utils import notify_attendance_regularization
            notify_attendance_regularization(reg)
        except Exception as e:
            print("Regularization notification error:", e)

        return Response(RegularizationSerializer(reg).data, status=status.HTTP_201_CREATED)


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
        ).exclude(
            employee=request.user
        ).select_related(
            'attendance', 'employee', 'employee__profile', 'approved_by'
        )
        return Response(RegularizationSerializer(regs, many=True).data)


# ── REGULARIZATION — APPROVE / REJECT ─────────────────────────────────────────

class ApproveRegularizationView(APIView):
    permission_classes = [make_permission('approve_regularize')]

    def post(self, request, pk):
        action = request.data.get('action')
        note   = request.data.get('note', '')

        if action not in ['approve', 'reject']:
            return Response({'error': 'action must be approve or reject'}, status=400)

        try:
            reg = AttendanceRegularization.objects.select_related('attendance').get(pk=pk)
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

        try:
            from notifications.utils import notify_regularization_actioned
            notify_regularization_actioned(reg, action, request.user)
        except Exception as e:
            print("Regularization action notification error:", e)

        if action == 'approve':
            record = reg.attendance

            if reg.requested_checkin:
                record.check_in = reg.requested_checkin
            if reg.requested_checkout:
                record.check_out = reg.requested_checkout

            if record.check_in and record.check_out:
                standard_hours = Decimal(str(get_standard_hours()))
                ci   = datetime.combine(date.today(), record.check_in)
                co   = datetime.combine(date.today(), record.check_out)
                diff = Decimal(str(round((co - ci).total_seconds() / 3600, 2)))
                record.hours_worked = diff
                record.ot_hours     = max(diff - standard_hours, Decimal('0'))
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