# lap/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from accounts.views import MyTokenObtainPairView

urlpatterns = [
    path('admin/',                    admin.site.urls),
    path('api/auth/login/',           MyTokenObtainPairView.as_view()),
    path('api/auth/token/refresh/',   TokenRefreshView.as_view()),
    path('api/auth/logout/',          TokenBlacklistView.as_view()),
    path('api/',                      include('accounts.urls')),
    path('api/',                      include('utils.urls')),
    path('api/',                      include('employees.urls')),
    path('api/',                      include('leave.urls')),
    path('api/',                      include('attendance.urls')),
    path('api/',                      include('payroll.urls')),
    path('api/',                     include('reports.urls')),
    path('api/',                     include('notifications.urls')),
    path('api/',                     include('support_tickets.urls')),
]
