# attendance/models.py
from django.db import models
from accounts.models import User


class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('present',  'Present'),
        ('absent',   'Absent'),
        ('half_day', 'Half Day'),
        ('late',     'Late'),
        ('holiday',  'Holiday'),
        ('weekend',  'Weekend'),
        ('leave',    'On Leave'),
    ]

    employee     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_records')
    date         = models.DateField()
    check_in     = models.TimeField(null=True, blank=True)
    check_out    = models.TimeField(null=True, blank=True)
    hours_worked = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='absent')
    is_wfh       = models.BooleanField(default=False)
    ot_hours     = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    note         = models.TextField(blank=True)
    is_locked    = models.BooleanField(default=False)  # locked by admin before payroll
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'date']
        ordering        = ['-date']

    def __str__(self):
        return f"{self.employee.username} | {self.date} | {self.status}"

    def calculate_hours(self):
        """Calculate hours worked from check_in and check_out."""
        if not self.check_in or not self.check_out:
            return 0
        from datetime import datetime, date
        ci = datetime.combine(date.today(), self.check_in)
        co = datetime.combine(date.today(), self.check_out)
        diff = (co - ci).total_seconds() / 3600
        return round(max(diff, 0), 2)


class AttendanceRegularization(models.Model):
    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    attendance   = models.OneToOneField(
        AttendanceRecord, on_delete=models.CASCADE,
        related_name='regularization'
    )
    employee     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='regularizations')
    reason       = models.TextField()
    requested_checkin  = models.TimeField(null=True, blank=True)
    requested_checkout = models.TimeField(null=True, blank=True)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by  = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='approved_regularizations'
    )
    approver_note = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee.username} | {self.attendance.date} | {self.status}"


class Holiday(models.Model):
    date        = models.DateField(unique=True)
    name        = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.date} — {self.name}"