# employees/models.py
from django.db import models
from accounts.models import User


class Department(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_by  = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='created_departments'
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class EmployeeProfile(models.Model):
    DESIGNATION_CHOICES = [
        ('software_engineer',   'Software Engineer'),
        ('senior_engineer',     'Senior Engineer'),
        ('team_lead',           'Team Lead'),
        ('project_manager',     'Project Manager'),
        ('hr_executive',        'HR Executive'),
        ('hr_manager',          'HR Manager'),
        ('accountant',          'Accountant'),
        ('analyst',             'Analyst'),
        ('intern',              'Intern'),
        ('other',               'Other'),
    ]

    user           = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    emp_code       = models.CharField(max_length=20, unique=True)
    department     = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL, related_name='employees')
    designation    = models.CharField(max_length=50, choices=DESIGNATION_CHOICES, default='other')
    date_of_birth  = models.DateField(null=True, blank=True)
    joining_date   = models.DateField()
    phone          = models.CharField(max_length=15, blank=True)
    address        = models.TextField(blank=True)
    manager        = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='subordinates'
    )
    bank_account   = models.CharField(max_length=20, blank=True)
    ifsc_code      = models.CharField(max_length=15, blank=True)
    pan_number     = models.CharField(max_length=10, blank=True)
    is_on_probation = models.BooleanField(default=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.emp_code} — {self.user.get_full_name()}"

    class Meta:
        ordering = ['emp_code']