# utils/serializers.py
from rest_framework import serializers
from .models import Permission, RolePermission


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'code', 'label', 'module', 'description']


class RolePermissionSerializer(serializers.ModelSerializer):
    permission_code = serializers.CharField(source='permission.code', read_only=True)
    permission_label = serializers.CharField(source='permission.label', read_only=True)
    permission_module = serializers.CharField(source='permission.module', read_only=True)

    class Meta:
        model = RolePermission
        fields = [
            'id', 'role', 'permission', 'permission_code',
            'permission_label', 'permission_module', 'is_granted'
        ]