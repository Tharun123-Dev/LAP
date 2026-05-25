# utils/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from django.shortcuts import get_object_or_404

from utils.permissions import make_permission, IsSuperAdmin, IsAuthenticatedUser
from .models import Permission, RolePermission, UserPermissionOverride
from .serializers import PermissionSerializer, UserPermissionOverrideSerializer
from accounts.models import User


class CanManagePermissions(IsSuperAdmin):
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

        return Response({'message': f'Permissions updated for {role}'})


# ──────────────────────────────────────────────────────────
# PER-EMPLOYEE PERMISSION OVERRIDES
# ──────────────────────────────────────────────────────────

class UserPermissionsView(APIView):
    """
    GET  /api/permissions/user/<user_id>/  → returns all permissions with:
        - role_default: what the role grants
        - override: custom override for this specific user (if any)
        - effective: final result
    POST /api/permissions/user/<user_id>/  → save overrides
    """
    permission_classes = [CanManagePermissions]

    def get(self, request, user_id):
        user = get_object_or_404(User, pk=user_id)
        all_perms = Permission.objects.all().order_by('module', 'code')

        # Role defaults
        role_granted = set(
            RolePermission.objects.filter(role=user.role, is_granted=True)
            .values_list('permission__code', flat=True)
        )

        # Existing overrides
        overrides = {
            o.permission.code: o.is_granted
            for o in UserPermissionOverride.objects.filter(user=user).select_related('permission')
        }

        result = []
        for perm in all_perms:
            role_default = perm.code in role_granted
            has_override = perm.code in overrides
            effective = overrides[perm.code] if has_override else role_default
            result.append({
                'code':         perm.code,
                'label':        perm.label,
                'module':       perm.module,
                'role_default': role_default,
                'has_override': has_override,
                'override_val': overrides.get(perm.code),
                'effective':    effective,
            })

        return Response({
            'user_id':      user.id,
            'username':     user.username,
            'display_role': user.get_display_role(),
            'base_role':    user.role,
            'permissions':  result,
        })

    def post(self, request, user_id):
        """
        Body: { overrides: [ {code, is_granted} ... ], clear: [code, ...] }
        'clear' removes an override so the user reverts to role default.
        """
        user = get_object_or_404(User, pk=user_id)
        overrides_data = request.data.get('overrides', [])
        clear_codes    = request.data.get('clear', [])

        for item in overrides_data:
            code = item.get('code')
            is_granted = item.get('is_granted', True)
            reason = item.get('reason', '')
            try:
                perm = Permission.objects.get(code=code)
                UserPermissionOverride.objects.update_or_create(
                    user=user, permission=perm,
                    defaults={
                        'is_granted': is_granted,
                        'reason': reason,
                        'granted_by': request.user
                    }
                )
            except Permission.DoesNotExist:
                pass

        for code in clear_codes:
            try:
                perm = Permission.objects.get(code=code)
                UserPermissionOverride.objects.filter(user=user, permission=perm).delete()
            except Permission.DoesNotExist:
                pass

        return Response({'message': f'Overrides saved for {user.username}'})


# ──────────────────────────────────────────────────────────
# CUSTOM ROLES CRUD
# ──────────────────────────────────────────────────────────

class CustomRoleListView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        from accounts.models import CustomRole
        roles = CustomRole.objects.filter(is_active=True).values(
            'id', 'name', 'display_name', 'level', 'base_role', 'description', 'created_at'
        )
        return Response(list(roles))

    def post(self, request):
        if not request.user.has_perm_code('manage_permissions'):
            return Response({'error': 'Permission denied'}, status=403)
        from accounts.models import CustomRole
        from accounts.serializers import CustomRoleSerializer
        ser = CustomRoleSerializer(data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data, status=201)
        return Response(ser.errors, status=400)


class CustomRoleDetailView(APIView):
    permission_classes = [CanManagePermissions]

    def patch(self, request, pk):
        from accounts.models import CustomRole
        from accounts.serializers import CustomRoleSerializer
        role = get_object_or_404(CustomRole, pk=pk)
        ser = CustomRoleSerializer(role, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    def delete(self, request, pk):
        from accounts.models import CustomRole
        role = get_object_or_404(CustomRole, pk=pk)
        role.is_active = False
        role.save()
        return Response({'message': 'Role deactivated'})