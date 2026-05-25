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

DEFAULT_SETTINGS = [
    # Attendance
    {'key': 'standard_hours',    'label': 'Standard Work Hours/Day',   'value': '8',   'category': 'attendance', 'description': 'Number of hours per working day'},
    {'key': 'work_days_per_week','label': 'Work Days Per Week',         'value': '5',   'category': 'attendance', 'description': 'Standard working days in a week'},
    {'key': 'grace_period_mins', 'label': 'Grace Period (Minutes)',     'value': '15',  'category': 'attendance', 'description': 'Minutes allowed after shift start before marking Late'},
    {'key': 'half_day_hours',    'label': 'Half-Day Threshold (Hours)', 'value': '4',   'category': 'attendance', 'description': 'Hours worked below which marks half-day absent'},
    # Leave
    {'key': 'advance_notice_cl', 'label': 'Casual Leave Advance Notice (Days)', 'value': '2', 'category': 'leave', 'description': 'Min days advance notice required for Casual Leave'},
    {'key': 'sick_cert_days',    'label': 'Sick Leave Certificate After (Days)', 'value': '2', 'category': 'leave', 'description': 'Medical cert required after this many consecutive sick days'},
    {'key': 'sandwich_rule',     'label': 'Sandwich Rule Enabled',      'value': 'true','category': 'leave', 'description': 'Count sandwiched weekends as leave days'},
    {'key': 'carry_fwd_max_el',  'label': 'Max Carry-Forward (Earned Leave)', 'value': '45', 'category': 'leave', 'description': 'Maximum days of Earned Leave that can be carried forward'},
    # Payroll
    {'key': 'payroll_day',       'label': 'Payroll Processing Day',     'value': '1',   'category': 'payroll', 'description': 'Day of month payroll is processed (1 = 1st)'},
    {'key': 'ot_multiplier',     'label': 'Overtime Multiplier',        'value': '1.5', 'category': 'payroll', 'description': 'Overtime pay multiplier (e.g., 1.5 = 1.5x hourly rate)'},
    {'key': 'esi_threshold',     'label': 'ESI Wage Threshold (₹)',     'value': '21000','category': 'payroll', 'description': 'Employees earning below this are ESI eligible'},
    # General
    {'key': 'company_name',      'label': 'Company Name',               'value': 'My Company', 'category': 'general', 'description': 'Company name shown on payslips and emails'},
    {'key': 'timezone',          'label': 'Timezone',                   'value': 'Asia/Kolkata','category': 'general', 'description': 'Default timezone for the system'},
    {'key': 'fiscal_year_start', 'label': 'Fiscal Year Start Month',    'value': '4',   'category': 'general', 'description': 'Month number fiscal year starts (4 = April)'},
]


def seed_default_settings():
    for s in DEFAULT_SETTINGS:
        SystemSetting.objects.get_or_create(key=s['key'], defaults=s)


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

        setting.value = str(value)
        setting.updated_by = request.user
        setting.save()
        return Response(SystemSettingSerializer(setting).data)