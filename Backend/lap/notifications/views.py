# notifications/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from rest_framework.permissions import BasePermission


class IsAdminOrHR(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ('superadmin', 'admin', 'hr')
        )
from .models import Notification, SystemSetting
from .serializers import NotificationSerializer, SystemSettingSerializer


# ─── Notification Views ──────────────────────────────────────────────────────

class MyNotificationsView(APIView):
    """GET /api/notifications/ — returns current user's notifications (latest 50)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(user=request.user)[:50]
        serializer = NotificationSerializer(notifs, many=True)
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({
            'notifications': serializer.data,
            'unread_count': unread_count,
        })


class MarkReadView(APIView):
    """POST /api/notifications/<id>/read/ — mark one notification as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        notif.is_read = True
        notif.save()
        return Response({'message': 'Marked as read'})


class MarkAllReadView(APIView):
    """POST /api/notifications/read-all/ — mark all user notifications as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': f'{updated} notifications marked as read'})


class UnreadCountView(APIView):
    """GET /api/notifications/unread-count/ — fast unread badge count."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})


class DeleteNotificationView(APIView):
    """DELETE /api/notifications/<id>/ — delete one notification."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        notif.delete()
        return Response({'message': 'Deleted'}, status=204)


# ─── System Settings Views ────────────────────────────────────────────────────

# Keys here match exactly what seed_system_settings.py and settings_helper.py use.
# This seeds only the critical keys needed on first GET — full seed is via management command.
DEFAULT_SETTINGS = [
    # Attendance — keys must match settings_helper.py
    {'key': 'work_hours_per_day',       'label': 'Work Hours Per Day',            'value': '8',          'value_type': 'integer',  'category': 'attendance', 'description': 'Standard hours per working day'},
    {'key': 'work_days_per_week',       'label': 'Work Days Per Week',            'value': '5',          'value_type': 'integer',  'category': 'attendance', 'description': 'Working days per week'},
    {'key': 'work_start_time',          'label': 'Work Start Time',               'value': '09:00',      'value_type': 'time',     'category': 'attendance', 'description': 'Shift start time (HH:MM)'},
    {'key': 'work_end_time',            'label': 'Work End Time',                 'value': '18:00',      'value_type': 'time',     'category': 'attendance', 'description': 'Shift end time (HH:MM)'},
    {'key': 'night_shift_enabled',      'label': 'Night Shift Enabled',           'value': 'false',      'value_type': 'boolean',  'category': 'attendance', 'description': 'Use separate night shift timings for night check-ins'},
    {'key': 'night_shift_start_time',   'label': 'Night Shift Start Time',        'value': '22:00',      'value_type': 'time',     'category': 'attendance', 'description': 'Night shift start time (HH:MM)'},
    {'key': 'night_shift_end_time',     'label': 'Night Shift End Time',          'value': '06:00',      'value_type': 'time',     'category': 'attendance', 'description': 'Night shift end time (HH:MM). Can be next day'},
    {'key': 'grace_period_minutes',     'label': 'Grace Period (Minutes)',        'value': '15',         'value_type': 'integer',  'category': 'attendance', 'description': 'Minutes after shift start before marking Late'},
    {'key': 'half_day_hours',           'label': 'Half-Day Threshold (Hours)',    'value': '4',          'value_type': 'decimal',  'category': 'attendance', 'description': 'Hours worked below which = half day'},
    {'key': 'late_marks_per_half_day',  'label': 'Late Marks per Half-Day LOP',  'value': '3',          'value_type': 'integer',  'category': 'attendance', 'description': 'Number of late marks that trigger 0.5 LOP deduction'},
    {'key': 'weekend_days',             'label': 'Weekend Days',                  'value': '["saturday","sunday"]', 'value_type': 'json', 'category': 'general', 'description': 'JSON list of weekend day names'},
    # Leave
  
    {'key': 'sl_doc_required_after_days','label': 'SL Certificate After (Days)', 'value': '2',          'value_type': 'integer',  'category': 'leave',      'description': 'Medical cert required after N sick days'},
    {'key': 'sandwich_rule_enabled',    'label': 'Sandwich Rule Enabled',        'value': 'true',       'value_type': 'boolean',  'category': 'leave',      'description': 'Count sandwiched weekends as leave'},
    {'key': 'el_max_carry_forward',     'label': 'Max EL Carry Forward (Days)',  'value': '45',         'value_type': 'integer',  'category': 'leave',      'description': 'Max Earned Leave days that carry forward'},
    # Payroll
    {'key': 'payroll_lock_day',         'label': 'Payroll Lock Day',             'value': '1',          'value_type': 'integer',  'category': 'payroll',    'description': 'Fixed at day 1. Payroll for a completed month can be approved and locked from the 1st of the next month.'},
    {'key': 'overtime_multiplier',      'label': 'Overtime Multiplier',          'value': '1.5',        'value_type': 'decimal',  'category': 'payroll',    'description': 'OT pay multiplier (1.5 = 1.5x hourly rate)'},
    {'key': 'esi_threshold_salary',     'label': 'ESI Wage Threshold (₹)',       'value': '21000',      'value_type': 'integer',  'category': 'payroll',    'description': 'Gross below this = ESI applicable'},
    {'key': 'pt_threshold_salary',      'label': 'PT Gross Threshold (INR)',     'value': '15000',      'value_type': 'integer',  'category': 'payroll',    'description': 'Monthly gross salary threshold for Professional Tax'},
    {'key': 'pt_below_threshold_amount','label': 'PT Below Threshold (INR)',     'value': '0',          'value_type': 'integer',  'category': 'payroll',    'description': 'Professional Tax deducted when monthly gross is below or equal to threshold'},
    {'key': 'pt_above_threshold_amount','label': 'PT Above Threshold (INR)',     'value': '200',        'value_type': 'integer',  'category': 'payroll',    'description': 'Professional Tax deducted when monthly gross is above threshold'},
    # General
   {'key': 'currency',          'label': 'Currency',          'value': 'INR',  'value_type': 'string', 'category': 'general', 'description': 'Currency symbol used in payroll and reports.'},
{'key': 'company_logo_url',  'label': 'Company Logo URL',  'value': '',     'value_type': 'string', 'category': 'general', 'description': 'Logo URL shown in payslip and email headers.'},
    {'key': 'timezone',                 'label': 'Timezone',                     'value': 'Asia/Kolkata','value_type': 'string',  'category': 'general',    'description': 'System timezone'},
    {'key': 'fiscal_year_start_month',  'label': 'Fiscal Year Start Month',      'value': '4',          'value_type': 'integer',  'category': 'general',    'description': 'Month fiscal year starts (4=April)'},
]


def seed_default_settings():
    for s in DEFAULT_SETTINGS:
        obj, _ = SystemSetting.objects.get_or_create(
            key=s['key'],
            defaults={
                'value':       s['value'],
                'value_type':  s.get('value_type', 'string'),
                'label':       s['label'],
                'category':    s['category'],
                'description': s['description'],
            }
        )
        if s['key'] == 'payroll_lock_day' and obj.value != '1':
            obj.value = '1'
            obj.description = s['description']
            obj.save(update_fields=['value', 'description'])
class SystemSettingsView(APIView):
    """GET /api/system-settings/ — list all, POST to bulk update (Admin only)."""

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminOrHR()]

    def get(self, request):
        seed_default_settings()
        settings_qs = SystemSetting.objects.all()
        data = {}
        for s in settings_qs:
            if s.category not in data:
                data[s.category] = []
            data[s.category].append(SystemSettingSerializer(s).data)
        return Response(data)

    def post(self, request):
        """Bulk update: send { key: new_value, ... }"""
        updates = request.data  # dict of { key: value }
        updated = []
        errors = []
        for key, value in updates.items():
            try:
                if key == 'payroll_lock_day':
                    value = '1'
                setting = SystemSetting.objects.get(key=key)
                setting.value = str(value)
                setting.updated_by = request.user
                setting.save()
                updated.append(key)
            except SystemSetting.DoesNotExist:
                errors.append(f'{key} not found')
        return Response({'updated': updated, 'errors': errors})


class SystemSettingDetailView(APIView):
    """PATCH /api/system-settings/<key>/ — update one setting (Admin only)."""
    permission_classes = [IsAdminOrHR]

    def patch(self, request, key):
        try:
            setting = SystemSetting.objects.get(key=key)
        except SystemSetting.DoesNotExist:
            return Response({'error': f'Setting "{key}" not found'}, status=404)

        value = request.data.get('value')
        if value is None:
            return Response({'error': '"value" field required'}, status=400)

        if key == 'payroll_lock_day':
            value = '1'

        setting.value = str(value)
        setting.updated_by = request.user
        setting.save()
        return Response(SystemSettingSerializer(setting).data)
