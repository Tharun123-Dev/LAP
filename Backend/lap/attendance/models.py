# attendance/models.py
import math
from django.db import models
from accounts.models import User


# ── OFFICE LOCATION (admin-configurable) ──────────────────────────────────────

class OfficeLocation(models.Model):
    """
    Stores the office GPS co-ordinates.
    Only one active record is used at a time (is_active=True).
    Admins can update latitude/longitude dynamically from the admin panel
    or via API — no code change needed.
    """
    name        = models.CharField(max_length=100, default='Head Office')
    latitude    = models.DecimalField(max_digits=9, decimal_places=6)
    longitude   = models.DecimalField(max_digits=9, decimal_places=6)
    radius_meters = models.PositiveIntegerField(default=300,
                    help_text='Allowed check-in radius in metres')
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_active', '-updated_at']

    def __str__(self):
        return f"{self.name} ({self.latitude}, {self.longitude}) r={self.radius_meters}m"

    @staticmethod
    def haversine(lat1, lon1, lat2, lon2):
        """Return distance in metres between two GPS co-ordinates."""
        R = 6_371_000  # Earth radius in metres
        phi1, phi2 = math.radians(float(lat1)), math.radians(float(lat2))
        dphi  = math.radians(float(lat2) - float(lat1))
        dlambda = math.radians(float(lon2) - float(lon1))
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return 2 * R * math.asin(math.sqrt(a))

    @classmethod
    def active(cls):
        """Return the currently active office location or None."""
        return cls.objects.filter(is_active=True).first()

    def distance_from(self, lat, lon):
        """Return metres from this office to the given GPS point."""
        return self.haversine(self.latitude, self.longitude, lat, lon)


# ── ATTENDANCE RECORD ─────────────────────────────────────────────────────────

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
    is_locked    = models.BooleanField(default=False)

    # ── Location tracking ─────────────────────────────────────────────────────
    checkin_latitude   = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    checkin_longitude  = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    checkout_latitude  = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    checkout_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    checkin_distance_m  = models.FloatField(null=True, blank=True,
                          help_text='Distance from office at check-in (metres)')
    checkout_distance_m = models.FloatField(null=True, blank=True,
                          help_text='Distance from office at check-out (metres)')

    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'date']
        ordering        = ['-date']

    def __str__(self):
        return f"{self.employee.username} | {self.date} | {self.status}"

    def calculate_hours(self):
        if not self.check_in or not self.check_out:
            return 0
        from datetime import datetime, date
        ci = datetime.combine(date.today(), self.check_in)
        co = datetime.combine(date.today(), self.check_out)
        diff = (co - ci).total_seconds() / 3600
        return round(max(diff, 0), 2)


# ── ATTENDANCE REGULARIZATION ─────────────────────────────────────────────────

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


# ── HOLIDAY ───────────────────────────────────────────────────────────────────

class Holiday(models.Model):
    date        = models.DateField(unique=True)
    name        = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.date} — {self.name}"