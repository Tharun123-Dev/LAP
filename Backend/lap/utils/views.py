# utils/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics

from utils.permissions import make_permission, IsSuperAdmin, IsAuthenticatedUser
from .models import Permission, RolePermission
from .serializers import PermissionSerializer


class CanManagePermissions(IsSuperAdmin):
    """Allows superadmin OR any role with manage_permissions grant."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'superadmin':
            return True
        return RolePermission.objects.filter(
            role=request.user.role,
            permission__code='manage_permissions',
            is_granted=True
        ).exists()


class PermissionListView(generics.ListAPIView):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [CanManagePermissions]


class AllRolesPermissionsView(APIView):
    permission_classes = [CanManagePermissions]

    def get(self, request):
        roles = ['superadmin', 'admin', 'manager', 'hr', 'employee']
        permissions = Permission.objects.all().order_by('module', 'code')
        role_perms  = RolePermission.objects.select_related('permission').all()

        lookup = {}
        for rp in role_perms:
            if rp.role not in lookup:
                lookup[rp.role] = {}
            lookup[rp.role][rp.permission.code] = rp.is_granted

        result = {}
        for role in roles:
            result[role] = []
            for perm in permissions:
                result[role].append({
                    'code':       perm.code,
                    'label':      perm.label,
                    'module':     perm.module,
                    'is_granted': lookup.get(role, {}).get(perm.code, False)
                })

        return Response(result)


class UpdateRolePermissionsView(APIView):
    permission_classes = [CanManagePermissions]

    def post(self, request, role):
        granted = request.data.get('granted', [])
        revoked = request.data.get('revoked', [])

        for code in granted:
            try:
                perm = Permission.objects.get(code=code)
                RolePermission.objects.update_or_create(
                    role=role, permission=perm,
                    defaults={'is_granted': True}
                )
            except Permission.DoesNotExist:
                pass

        for code in revoked:
            try:
                perm = Permission.objects.get(code=code)
                RolePermission.objects.update_or_create(
                    role=role, permission=perm,
                    defaults={'is_granted': False}
                )
            except Permission.DoesNotExist:
                pass

        return Response({
            'message': f'Permissions updated for {role}',
            'granted': granted,
            'revoked': revoked
        })