# utils/urls.py
from django.urls import path
from .views import PermissionListView, AllRolesPermissionsView, UpdateRolePermissionsView

urlpatterns = [
    path('permissions/',                          PermissionListView.as_view()),
    path('permissions/roles/',                    AllRolesPermissionsView.as_view()),
    path('permissions/roles/<str:role>/update/',  UpdateRolePermissionsView.as_view()),
]