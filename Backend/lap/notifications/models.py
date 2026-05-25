# notifications/models.py
from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = [
        ('leave_applied',    'Leave Applied'),
        ('leave_approved',   'Leave Approved'),
        ('leave_rejected',   'Leave Rejected'),
        ('leave_cancelled',  'Leave Cancelled'),
        ('attendance_absent','Attendance Absent'),
        ('regularization',   'Regularization Request'),
        ('payroll_processed','Payroll Processed'),
        ('leave_balance_low','Leave Balance Low'),
        ('new_account',      'New Account Created'),
        ('general',          'General'),
    ]

    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title      = models.CharField(max_length=200)
    body       = models.TextField()
    type       = models.CharField(max_length=30, choices=TYPE_CHOICES, default='general')
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.type}] {self.user.username}: {self.title}"


class SystemSetting(models.Model):
    """Key-value store for company-wide system settings."""
    CATEGORIES = [
        ('attendance', 'Attendance'),
        ('leave',      'Leave'),
        ('payroll',    'Payroll'),
        ('general',    'General'),
    ]

    key         = models.CharField(max_length=100, unique=True)
    value       = models.TextField()
    label       = models.CharField(max_length=200)
    category    = models.CharField(max_length=30, choices=CATEGORIES, default='general')
    description = models.TextField(blank=True)
    updated_at  = models.DateTimeField(auto_now=True)
    updated_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='updated_settings'
    )

    class Meta:
        ordering = ['category', 'key']

    def __str__(self):
        return f"{self.category} | {self.key} = {self.value}"