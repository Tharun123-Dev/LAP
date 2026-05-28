# attendance/views.py
# ── REPLACEMENT FILE ──
# Replace: Backend/lap/attendance/views.py
# Changes:
#  1. HolidayDetailView added  (PUT / PATCH / DELETE on individual holiday)
#  2. MyAttendanceView — holiday days injected into records list with
#     status='holiday'; summary.present includes holiday count
#  3. All datetime.now() → timezone.localtime(timezone.now()) for tz-awareness
from datetime import date, datetime, time, timedelta
from decimal import Decimal
import calendar as cal_mod

from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from django.shortcuts import get_object_or_404

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
    get_shift_end,
    get_grace_minutes,
    get_standard_hours,
    get_half_day_hours,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _now_local():
    return timezone.localtime(timezone.now())

def _today_local() -> date:
    return _now_local().date()

def _now_time_local() -> time:
    return _now_local().time().replace(tzinfo=None)


def _get_status(check_in, check_out, hours_worked):
    if not check_in:
        return 'absent'
    if not check_out:
        return 'half_day'

    shift_start    = get_shift_start()
    grace_minutes  = get_grace_minutes()
    half_day_hours = Decimal(str(get_half_day_hours()))

    ref_date     = date(2000, 1, 1)
    grace_cutoff = datetime.combine(ref_date, shift_start) + timedelta(minutes=grace_minutes)
    ci           = datetime.combine(ref_date, check_in)

    if hours_worked < half_day_hours:
        return 'half_day'
    if ci > grace_cutoff:
        return 'late'
    return 'present'


def _calculate_ot_hours(check_in, check_out):
    if not check_in or not check_out:
        return Decimal('0')

    shift_end = get_shift_end()
    shift_start = get_shift_start()
    grace_minutes = get_grace_minutes()
    ref_date = date(2000, 1, 1)
    ci = datetime.combine(ref_date, check_in)
    co = datetime.combine(ref_date, check_out)
    start = datetime.combine(ref_date, shift_start)
    end = datetime.combine(ref_date, shift_end)
    grace_cutoff = start + timedelta(minutes=grace_minutes)
    late_minutes = max((ci - grace_cutoff).total_seconds() / 60, 0)
    ot_start = end + timedelta(minutes=late_minutes)

    if co <= ot_start:
        return Decimal('0')

    hours = (co - ot_start).total_seconds() / 3600
    return Decimal(str(round(hours, 2)))


def _validate_location(lat, lon):
    office = OfficeLocation.active()
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
            False, round(distance_m, 1), office,
            f'You are {round(distance_m, 0):.0f} m away from the office. '
            f'Check-in is only allowed within {office.radius_meters} m.',
        )
    return True, round(distance_m, 1), office, None


# ── OFFICE LOCATION ────────────────────────────────────────────────────────────

class OfficeLocationView(APIView):
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
        name          = request.data.get('name', 'Head Office')
        latitude      = request.data.get('latitude')
        longitude     = request.data.get('longitude')
        radius_meters = request.data.get('radius_meters', 300)
        if latitude is None or longitude is None:
            return Response({'error': 'latitude and longitude are required'}, status=status.HTTP_400_BAD_REQUEST)
        OfficeLocation.objects.filter(is_active=True).update(is_active=False)
        office = OfficeLocation.objects.create(
            name=name, latitude=latitude, longitude=longitude,
            radius_meters=radius_meters, is_active=True,
        )
        return Response(OfficeLocationSerializer(office).data, status=status.HTTP_201_CREATED)


# ── CHECK-IN ──────────────────────────────────────────────────────────────────

class CheckInView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        today    = _today_local()
        is_wfh   = request.data.get('is_wfh', False)
        now_time = _now_time_local()

        if not is_wfh:
            lat = request.data.get('latitude')
            lon = request.data.get('longitude')
            ok, distance_m, office, error_msg = _validate_location(lat, lon)
            if not ok:
                return Response(
                    {'error': error_msg, 'distance_m': distance_m, 'allowed_radius': office.radius_meters if office else None},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            lat, lon, distance_m = None, None, None

        existing = AttendanceRecord.objects.filter(employee=request.user, date=today).first()
        if existing and existing.check_in:
            return Response({'error': 'Already checked in today'}, status=status.HTTP_400_BAD_REQUEST)

        if existing:
            existing.check_in = now_time
            existing.is_wfh   = is_wfh
            if lat is not None:
                existing.checkin_latitude   = lat
                existing.checkin_longitude  = lon
                existing.checkin_distance_m = distance_m
            existing.save()
            record = existing
        else:
            record = AttendanceRecord.objects.create(
                employee=request.user, date=today, check_in=now_time,
                is_wfh=is_wfh, status='present',
                checkin_latitude=lat, checkin_longitude=lon, checkin_distance_m=distance_m,
            )
        return Response(AttendanceRecordSerializer(record).data, status=status.HTTP_200_OK)


# ── CHECK-OUT ─────────────────────────────────────────────────────────────────

class CheckOutView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        today    = _today_local()
        now_time = _now_time_local()
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')

        record = AttendanceRecord.objects.filter(employee=request.user, date=today).first()
        if not record or not record.check_in:
            return Response({'error': 'No check-in found for today'}, status=status.HTTP_400_BAD_REQUEST)
        if record.check_out:
            return Response({'error': 'Already checked out today'}, status=status.HTTP_400_BAD_REQUEST)

        if not record.is_wfh:
            ok, distance_m, office, error_msg = _validate_location(lat, lon)
            if not ok:
                return Response(
                    {'error': error_msg, 'distance_m': distance_m, 'allowed_radius': office.radius_meters if office else None},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            distance_m = None

        record.check_out    = now_time
        record.hours_worked = Decimal(str(record.calculate_hours()))

        record.ot_hours = _calculate_ot_hours(record.check_in, record.check_out)

        if lat is not None and not record.is_wfh:
            record.checkout_latitude   = lat
            record.checkout_longitude  = lon
            record.checkout_distance_m = distance_m

        record.status = _get_status(record.check_in, record.check_out, record.hours_worked)
        record.save()
        return Response(AttendanceRecordSerializer(record).data)


# ── TODAY ATTENDANCE ──────────────────────────────────────────────────────────

class TodayAttendanceView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        today   = _today_local()
        record  = AttendanceRecord.objects.filter(employee=request.user, date=today).first()
        holiday = Holiday.objects.filter(date=today).first()
        return Response({
            'record':  AttendanceRecordSerializer(record).data if record else None,
            'is_wfh':  record.is_wfh if record else False,
            'holiday': {'date': str(holiday.date), 'name': holiday.name} if holiday else None,
            'date':    str(today),
        })


# ── MY ATTENDANCE (monthly view) ──────────────────────────────────────────────

class MyAttendanceView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        today = _today_local()
        month = int(request.query_params.get('month', today.month))
        year  = int(request.query_params.get('year',  today.year))

        records = AttendanceRecord.objects.filter(
            employee=request.user, date__year=year, date__month=month,
        ).order_by('date')

        from leave.models import LeaveRequest
        approved_leaves = LeaveRequest.objects.filter(
            employee=request.user, status='approved',
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

        holidays = list(Holiday.objects.filter(date__year=year, date__month=month).values('date', 'name'))
        holiday_date_set = {str(h['date']) for h in holidays}

        record_map     = {str(r.date): r for r in records}
        existing_dates = set(record_map.keys())
        serialized     = list(AttendanceRecordSerializer(records, many=True).data)

        today_str = str(today)

        # Missing checkout is not final until corrected/approved.
        for rec in serialized:
            if rec.get('check_in') and not rec.get('check_out') and rec.get('date') != today_str:
                rec['status'] = 'pending'
                rec['pending_reason'] = 'missing_checkout'

        from attendance.settings_helper import is_weekend as _is_weekend
        month_end = date(year, month, cal_mod.monthrange(year, month)[1])
        visible_until = min(today - timedelta(days=1), month_end)
        cur = date(year, month, 1)
        while cur <= visible_until:
            cur_str = str(cur)
            if (
                not _is_weekend(cur)
                and cur_str not in existing_dates
                and cur_str not in holiday_date_set
                and cur_str not in leave_dates
            ):
                serialized.append({
                    'id': None, 'date': cur_str,
                    'check_in': None, 'check_out': None,
                    'hours_worked': 0, 'ot_hours': 0,
                    'status': 'pending', 'is_wfh': False,
                    'leave_name': None, 'is_lop': False,
                    'pending_reason': 'missing_attendance',
                })
            cur += timedelta(days=1)

        # ── Inject holiday virtual records ────────────────────────────────────
        # If there is no attendance record on a holiday → create a virtual entry
        # with status='holiday' so the calendar shows it correctly.
        # If there IS a record on that day → tag it with holiday_name.
        for h in holidays:
            h_str = str(h['date'])
            if h_str not in existing_dates:
                serialized.append({
                    'id': None, 'date': h_str,
                    'check_in': None, 'check_out': None,
                    'hours_worked': 0, 'ot_hours': 0,
                    'status': 'holiday', 'is_wfh': False,
                    'leave_name': None, 'is_lop': False,
                    'holiday_name': h['name'],
                })
            else:
                for rec in serialized:
                    if rec.get('date') == h_str:
                        rec['holiday_name'] = h['name']
                        # Keep original status (present/late etc.) but flag holiday
                        if rec.get('status') in ('absent',):
                            rec['status'] = 'holiday'
                        break

        # ── Inject approved leave records ─────────────────────────────────────
        for date_str, leave_info in leave_dates.items():
            leave_status = 'lop_leave' if leave_info['is_lop'] else 'leave'
            if date_str not in existing_dates and date_str not in holiday_date_set:
                serialized.append({
                    'id': None, 'date': date_str,
                    'check_in': None, 'check_out': None,
                    'hours_worked': 0, 'ot_hours': 0,
                    'status': leave_status, 'is_wfh': False,
                    'leave_name': leave_info['name'], 'is_lop': leave_info['is_lop'],
                })
            elif date_str not in holiday_date_set:
                for rec in serialized:
                    if rec.get('date') == date_str:
                        if rec.get('status') in ('absent', 'leave', 'lop_leave'):
                            rec['status'] = leave_status
                        rec['leave_name'] = leave_info['name']
                        rec['is_lop']     = leave_info['is_lop']
                        break

        # ── Summary ───────────────────────────────────────────────────────────
        status_counts = {}
        for rec in serialized:
            st = rec.get('status', 'absent')
            status_counts[st] = status_counts.get(st, 0) + 1

        summary = {
            # present + late + holiday all count as "present" for display
            'present':   status_counts.get('present', 0) + status_counts.get('late', 0) + status_counts.get('holiday', 0),
            'absent':    status_counts.get('absent', 0),
            'pending':   status_counts.get('pending', 0),
            'late':      status_counts.get('late', 0),
            'half_day':  status_counts.get('half_day', 0),
            'leave':     status_counts.get('leave', 0),
            'lop_leave': status_counts.get('lop_leave', 0),
            'holiday':   status_counts.get('holiday', 0),
            'total_hours': float(sum(r.hours_worked for r in records if r.hours_worked)),
            'total_ot':    float(sum(r.ot_hours     for r in records if r.ot_hours)),
        }

        shift_start   = get_shift_start()
        grace_minutes = get_grace_minutes()
        late_cutoff   = (
            datetime.combine(today, shift_start) + timedelta(minutes=grace_minutes)
        ).strftime('%H:%M')

        return Response({
            'month':    month,
            'year':     year,
            'summary':  summary,
            'records':  serialized,
            'holidays': holidays,
            'policy': {
                'shift_start':   shift_start.strftime('%H:%M'),
                'grace_minutes': grace_minutes,
                'late_cutoff':   late_cutoff,
            },
        })


# ── ALL EMPLOYEES ATTENDANCE ──────────────────────────────────────────────────

class AllAttendanceView(APIView):
    permission_classes = [make_permission('view_team_attendance')]

    def get(self, request):
        today  = _today_local()
        month  = int(request.query_params.get('month', today.month))
        year   = int(request.query_params.get('year',  today.year))
        emp_id = request.query_params.get('employee')

        qs = AttendanceRecord.objects.filter(
            date__year=year, date__month=month,
        ).select_related('employee', 'employee__profile').order_by('employee__username', 'date')

        if emp_id:
            qs = qs.filter(employee_id=emp_id)
        return Response(AttendanceRecordSerializer(qs, many=True).data)


# ── APPLY REGULARISATION ──────────────────────────────────────────────────────

class ApplyRegularizationView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        attendance_id      = request.data.get('attendance_id')
        request_date       = request.data.get('date')
        reason             = request.data.get('reason', '')
        requested_checkin  = request.data.get('requested_checkin')
        requested_checkout = request.data.get('requested_checkout')

        if attendance_id:
            try:
                record = AttendanceRecord.objects.get(id=attendance_id, employee=request.user)
            except AttendanceRecord.DoesNotExist:
                return Response({'error': 'Attendance record not found'}, status=status.HTTP_404_NOT_FOUND)
        elif request_date:
            try:
                parsed_date = date.fromisoformat(request_date)
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

            record, _ = AttendanceRecord.objects.get_or_create(
                employee=request.user,
                date=parsed_date,
                defaults={'status': 'pending', 'note': 'Pending regularization request'},
            )
        else:
            return Response({'error': 'attendance_id or date is required'}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(record, 'regularization'):
            reg = record.regularization
            if reg.status == 'rejected':
                reg.status = 'pending'
                reg.reason = reason
                reg.requested_checkin = requested_checkin
                reg.requested_checkout = requested_checkout
                reg.approved_by = None
                reg.approver_note = ''
                reg.save()
                return Response(RegularizationSerializer(reg).data, status=status.HTTP_200_OK)
            return Response({'error': 'Regularisation already submitted for this date'}, status=status.HTTP_400_BAD_REQUEST)

        reg = AttendanceRegularization.objects.create(
            attendance=record, employee=request.user,
            reason=reason,
            requested_checkin=requested_checkin, requested_checkout=requested_checkout,
        )
        return Response(RegularizationSerializer(reg).data, status=status.HTTP_201_CREATED)


# ── MY REGULARISATIONS ────────────────────────────────────────────────────────

class MyRegularizationsView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        regs = AttendanceRegularization.objects.filter(employee=request.user).order_by('-created_at')
        return Response(RegularizationSerializer(regs, many=True).data)


# ── ALL REGULARISATIONS ───────────────────────────────────────────────────────

class AllRegularizationsView(APIView):
    permission_classes = [make_permission('approve_regularize')]

    def get(self, request):
        status_filter = request.query_params.get('status')
        qs = AttendanceRegularization.objects.select_related(
            'employee', 'employee__profile', 'attendance',
        ).exclude(employee=request.user).order_by('-created_at')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(RegularizationSerializer(qs, many=True).data)


# ── APPROVE / REJECT REGULARISATION ──────────────────────────────────────────

class ApproveRegularizationView(APIView):
    permission_classes = [make_permission('approve_regularize')]

    def post(self, request, pk):
        reg    = get_object_or_404(AttendanceRegularization, pk=pk)
        action = request.data.get('action')
        note   = request.data.get('note', '')

        if action not in ('approve', 'reject'):
            return Response({'error': "action must be 'approve' or 'reject'"}, status=status.HTTP_400_BAD_REQUEST)

        reg.status        = 'approved' if action == 'approve' else 'rejected'
        reg.approved_by   = request.user
        reg.approver_note = note

        if action == 'approve':
            record = reg.attendance
            if reg.requested_checkin:
                record.check_in  = reg.requested_checkin
            if reg.requested_checkout:
                record.check_out = reg.requested_checkout
            if record.check_in and record.check_out:
                record.hours_worked = Decimal(str(record.calculate_hours()))
                record.ot_hours = _calculate_ot_hours(record.check_in, record.check_out)
                record.status = _get_status(record.check_in, record.check_out, record.hours_worked)
            record.save()

        reg.save()
        return Response({'message': f'Regularisation {reg.status}', 'data': RegularizationSerializer(reg).data})


# ── HOLIDAYS — LIST / CREATE ──────────────────────────────────────────────────
# GET  /attendance/holidays/     — all authenticated users
# POST /attendance/holidays/     — manage_settings only

class HolidayListView(generics.ListCreateAPIView):
    queryset         = Holiday.objects.all()
    serializer_class = HolidaySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticatedUser()]
        return [make_permission('manage_settings')()]


# ── HOLIDAYS — EDIT / DELETE ──────────────────────────────────────────────────
# PUT   /attendance/holidays/<id>/
# PATCH /attendance/holidays/<id>/
# DELETE /attendance/holidays/<id>/

class HolidayDetailView(APIView):
    permission_classes = [make_permission('manage_settings')]

    def _get_holiday(self, pk):
        return get_object_or_404(Holiday, pk=pk)

    def put(self, request, pk):
        holiday    = self._get_holiday(pk)
        serializer = HolidaySerializer(holiday, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        holiday    = self._get_holiday(pk)
        serializer = HolidaySerializer(holiday, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        holiday = self._get_holiday(pk)
        name    = holiday.name
        holiday.delete()
        return Response({'message': f'Holiday "{name}" deleted successfully.'}, status=status.HTTP_200_OK)
