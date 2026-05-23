# attendance/admin.py
from django.contrib import admin
from .models import AttendanceRecord, AttendanceRegularization, Holiday

@admin.register(AttendanceRecord)
class AttendanceAdmin(admin.ModelAdmin):
    list_display  = ['employee', 'date', 'check_in', 'check_out', 'hours_worked', 'status', 'is_wfh']
    list_filter   = ['status', 'date', 'is_wfh']
    search_fields = ['employee__username', 'employee__first_name']

@admin.register(AttendanceRegularization)
class RegularizationAdmin(admin.ModelAdmin):
    list_display  = ['employee', 'attendance', 'status', 'created_at']
    list_filter   = ['status']

@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ['date', 'name']