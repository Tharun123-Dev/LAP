# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLES = [
        ('superadmin', 'SuperAdmin'),
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('hr', 'HR'),
        ('employee', 'Employee'),
    ]
    EMP_TYPES = [
        ('regular', 'Regular'),
        ('contract', 'Contract'),
        ('parttime', 'Part-Time'),
        ('intern', 'Intern'),
    ]

    role = models.CharField(max_length=20, choices=ROLES, default='employee')
    employee_type = models.CharField(max_length=20, choices=EMP_TYPES, default='regular')
    created_by = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='created_users'
    )

    def __str__(self):
        return f"{self.username} ({self.role})"

    def get_permissions_list(self):
        from utils.models import RolePermission
        return list(
            RolePermission.objects.filter(
                role=self.role,
                is_granted=True
            ).values_list('permission__code', flat=True)
        )

    def has_perm_code(self, code):
        from utils.models import RolePermission
        return RolePermission.objects.filter(
            role=self.role,
            permission__code=code,
            is_granted=True
        ).exists()