# attendance/serializers.py
from rest_framework import serializers
from .models import AttendanceRecord, AttendanceRegularization, Holiday


class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    emp_code      = serializers.SerializerMethodField()

    class Meta:
        model  = AttendanceRecord
        fields = [
            'id', 'employee', 'employee_name', 'emp_code',
            'date', 'check_in', 'check_out', 'hours_worked',
            'status', 'is_wfh', 'ot_hours', 'note', 'is_locked',
        ]

    def get_employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.username

    def get_emp_code(self, obj):
        try:
            return obj.employee.profile.emp_code
        except Exception:
            return ''


class RegularizationSerializer(serializers.ModelSerializer):
    employee_name  = serializers.CharField(source='employee.get_full_name', read_only=True)
    emp_code       = serializers.SerializerMethodField()
    date           = serializers.DateField(source='attendance.date', read_only=True)
    current_checkin  = serializers.TimeField(source='attendance.check_in',  read_only=True)
    current_checkout = serializers.TimeField(source='attendance.check_out', read_only=True)
    current_status   = serializers.CharField(source='attendance.status',    read_only=True)
    approver_name    = serializers.SerializerMethodField()

    class Meta:
        model  = AttendanceRegularization
        fields = [
            'id', 'attendance', 'employee', 'employee_name', 'emp_code',
            'date', 'reason',
            'requested_checkin', 'requested_checkout',
            'current_checkin', 'current_checkout', 'current_status',
            'status', 'approved_by', 'approver_name', 'approver_note',
            'created_at',
        ]

    def get_emp_code(self, obj):
        try:
            return obj.employee.profile.emp_code
        except Exception:
            return ''

    def get_approver_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name() or obj.approved_by.username
        return None


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Holiday
        fields = ['id', 'date', 'name', 'description']