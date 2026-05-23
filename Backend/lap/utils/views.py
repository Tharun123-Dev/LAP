# utils/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics

# ✅ make_permission only — no HasPermission
from utils.permissions import make_permission
from .models import Permission, RolePermission
from .serializers import PermissionSerializer


class PermissionListView(generics.ListAPIView):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [make_permission('manage_permissions')]


class AllRolesPermissionsView(APIView):
    permission_classes = [make_permission('manage_permissions')]

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
    permission_classes = [make_permission('manage_permissions')]

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