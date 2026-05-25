# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomRole(models.Model):
    """
    Fully dynamic roles — no hardcoding.
    SuperAdmin/Admin can create roles like 'Senior Engineer', 'Junior Dev', etc.
    """
    name        = models.CharField(max_length=50, unique=True)
    display_name = models.CharField(max_length=100)
    # hierarchy level: lower number = more power (superadmin=1, admin=2, etc.)
    level       = models.IntegerField(default=10)
    # Base role for permission inheritance: superadmin/admin/manager/hr/employee
    base_role   = models.CharField(max_length=20, default='employee')
    is_active   = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['level', 'name']

    def __str__(self):
        return f"{self.display_name} (level {self.level})"


class User(AbstractUser):
    # base_role is kept for backward compat & JWT
    BASE_ROLES = [
        ('superadmin', 'SuperAdmin'),
        ('admin',      'Admin'),
        ('admin', 'Admin'),
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
    # custom_role links to CustomRole table — e.g. "Senior Engineer"
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
        """The role used for permission lookups."""
        return self.role  # base role drives permissions

    def get_display_role(self):
        """Human-readable role shown in UI."""
        if self.custom_role:
            return self.custom_role.display_name
        return dict(self.BASE_ROLES).get(self.role, self.role)

    def get_permissions_list(self):
        from utils.models import RolePermission, UserPermissionOverride
        # Start with role-level permissions
        role_perms = set(
            RolePermission.objects.filter(
                role=self.role, is_granted=True
            ).values_list('permission__code', flat=True)
        )
        # Apply per-user overrides
        overrides = UserPermissionOverride.objects.filter(user=self).select_related('permission')
        for override in overrides:
            if override.is_granted:
                role_perms.add(override.permission.code)
            else:
                role_perms.discard(override.permission.code)
        return list(role_perms)

    def has_perm_code(self, code):
        from utils.models import RolePermission, UserPermissionOverride
        # Check user-level override first
        override = UserPermissionOverride.objects.filter(
            user=self, permission__code=code
        ).first()
        if override is not None:
            return override.is_granted
        # Fallback to role-level
        return RolePermission.objects.filter(
            role=self.role,
            permission__code=code,
            is_granted=True
        ).exists()