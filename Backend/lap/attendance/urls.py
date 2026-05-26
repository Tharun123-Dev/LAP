# attendance/urls.py
from django.urls import path
from .views import (
    CheckInView, CheckOutView, TodayAttendanceView,
    MyAttendanceView, AllAttendanceView,
    ApplyRegularizationView, MyRegularizationsView,
    AllRegularizationsView, ApproveRegularizationView,
    HolidayListView,
    OfficeLocationView,
)

urlpatterns = [
    # ── Core check-in/out ─────────────────────────────────────────────────────
    path('attendance/checkin/',                         CheckInView.as_view()),
    path('attendance/checkout/',                        CheckOutView.as_view()),
    path('attendance/today/',                           TodayAttendanceView.as_view()),

    # ── Records ───────────────────────────────────────────────────────────────
    path('attendance/my/',                              MyAttendanceView.as_view()),
    path('attendance/all/',                             AllAttendanceView.as_view()),

    # ── Regularization ────────────────────────────────────────────────────────
    path('attendance/regularize/',                      ApplyRegularizationView.as_view()),
    path('attendance/regularize/my/',                   MyRegularizationsView.as_view()),
    path('attendance/regularize/all/',                  AllRegularizationsView.as_view()),
    path('attendance/regularize/<int:pk>/action/',      ApproveRegularizationView.as_view()),

    # ── Holidays ──────────────────────────────────────────────────────────────
    path('attendance/holidays/',                        HolidayListView.as_view()),

    # ── Office Location (dynamic GPS config) ──────────────────────────────────
    path('attendance/office-location/',                 OfficeLocationView.as_view()),
]