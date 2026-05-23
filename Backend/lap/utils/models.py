# utils/models.py
from django.db import models


class Permission(models.Model):
    MODULES = [
        ('employees', 'Employees'),
        ('departments', 'Departments'),
        ('attendance', 'Attendance'),
        ('leave', 'Leave'),
        ('payroll', 'Payroll'),
        ('reports', 'Reports'),
        ('users', 'Users'),
        ('settings', 'Settings'),
    ]

    code = models.CharField(max_length=100, unique=True)
    label = models.CharField(max_length=100)
    module = models.CharField(max_length=50, choices=MODULES)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.module} | {self.label}"

    class Meta:
        ordering = ['module', 'code']


class RolePermission(models.Model):
    ROLES = [
        ('superadmin', 'SuperAdmin'),
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('hr', 'HR'),
        ('employee', 'Employee'),
    ]

    role = models.CharField(max_length=20, choices=ROLES)
    permission = models.ForeignKey(
        Permission, on_delete=models.CASCADE,
        related_name='role_permissions'
    )
    is_granted = models.BooleanField(default=False)

    class Meta:
        unique_together = ['role', 'permission']

    def __str__(self):
        status = 'YES' if self.is_granted else 'NO'
        return f"{self.role} | {self.permission.code} = {status}"