# utils/permissions.py
from rest_framework.permissions import BasePermission
from .models import RolePermission


def make_permission(code):
    """
    Factory — returns a DRF-compatible permission class.
    Usage: permission_classes = [make_permission('approve_leave')]
    """
    class DynamicPermission(BasePermission):
        perm_code = code

        def has_permission(self, request, view):
            if not request.user or not request.user.is_authenticated:
                return False
            return RolePermission.objects.filter(
                role=request.user.role,
                permission__code=self.perm_code,
                is_granted=True
            ).exists()

    DynamicPermission.__name__ = f'Permission_{code}'
    return DynamicPermission


# ── Alias so any file still importing HasPermission won't crash ──
# HasPermission is now just make_permission
HasPermission = make_permission


class IsAuthenticatedUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'superadmin'
        )