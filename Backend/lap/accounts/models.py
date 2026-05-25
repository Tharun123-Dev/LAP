# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomRole(models.Model):
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
        ('employee',   'Employee'),
    ]
    EMP_TYPES = [
        ('regular',  'Regular'),
        ('contract', 'Contract'),
        ('parttime', 'Part-Time'),
        ('intern',   'Intern'),
    ]

    role          = models.CharField(max_length=20, choices=BASE_ROLES, default='employee')
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
        return self.role

    def get_display_role(self):
        if self.custom_role:
            return self.custom_role.display_name
        return dict(self.BASE_ROLES).get(self.role, self.role)

    def get_permissions_list(self):
        """
        Superadmin/Admin: all permissions granted.
        Others: ONLY their explicitly granted UserPermissionOverride entries.
        This means admin must explicitly grant permissions to each employee.
        """
        from utils.models import Permission, UserPermissionOverride

        # Superadmin and Admin always get all permissions
        if self.role in ('superadmin', 'admin'):
            return list(Permission.objects.values_list('code', flat=True))

        # All other users: ONLY explicitly granted overrides
        granted = UserPermissionOverride.objects.filter(
            user=self, is_granted=True
        ).values_list('permission__code', flat=True)
        return list(granted)

    def has_perm_code(self, code):
        from utils.models import Permission, UserPermissionOverride

        if self.role in ('superadmin', 'admin'):
            return True

        return UserPermissionOverride.objects.filter(
            user=self, permission__code=code, is_granted=True
        ).exists()