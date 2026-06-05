# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


class Tenant(models.Model):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class CustomRole(models.Model):
    tenant_id = models.CharField(max_length=64, default='default', db_index=True)
    name        = models.CharField(max_length=50, unique=True)
    display_name = models.CharField(max_length=100)
    level       = models.IntegerField(default=10)
    base_role   = models.CharField(max_length=20, default='employee')
    is_active   = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['level', 'name']

    def __str__(self):
        return f"{self.display_name} (level {self.level})"


class User(AbstractUser):
    BASE_ROLES = [
        ('superadmin', 'SuperAdmin'),
        ('admin',      'Admin'),
        ('manager',    'Manager'),
        ('hr',         'HR'),
        ('counselor',  'Counselor'),
        ('employee',   'Employee'),
    ]
    EMP_TYPES = [
        ('regular',  'Regular'),
        ('contract', 'Contract'),
        ('parttime', 'Part-Time'),
        ('intern',   'Intern'),
    ]

    role          = models.CharField(max_length=20, choices=BASE_ROLES, default='employee')
    tenant_id     = models.CharField(max_length=64, default='default', db_index=True)
    custom_role   = models.ForeignKey(
        CustomRole, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='users'
    )
    employee_type = models.CharField(max_length=20, choices=EMP_TYPES, default='regular')
    created_by    = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='created_users'
    )

    def __str__(self):
        label = self.custom_role.display_name if self.custom_role else self.role
        return f"{self.username} ({label})"

    def get_effective_role(self):
        if self.is_superuser:
            return 'superadmin'
        if self.custom_role and self.custom_role.is_active and self.custom_role.base_role:
            return self.custom_role.base_role
        return self.role

    def get_display_role(self):
        if self.custom_role:
            return self.custom_role.display_name
        return dict(self.BASE_ROLES).get(self.role, self.role)

    def get_permissions_list(self):
        """
        Django superuser: all permissions granted.
        Normal users: only explicitly granted user permissions.
        """
        from utils.models import Permission, UserPermissionOverride

        if self.is_superuser:
            return list(Permission.objects.values_list('code', flat=True))

        return list(UserPermissionOverride.objects.filter(
            user=self,
            is_granted=True,
        ).values_list('permission__code', flat=True))

    def has_perm_code(self, code):
        from utils.models import UserPermissionOverride

        if self.is_superuser:
            return True

        return UserPermissionOverride.objects.filter(
            user=self,
            permission__code=code,
            is_granted=True,
        ).exists()
