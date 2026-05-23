# attendance/urls.py
from django.urls import path
from .views import (
    CheckInView, CheckOutView, TodayAttendanceView,
    MyAttendanceView, AllAttendanceView,
    ApplyRegularizationView, MyRegularizationsView,
    AllRegularizationsView, ApproveRegularizationView,
    HolidayListView,
)

urlpatterns = [
    path('attendance/checkin/',                         CheckInView.as_view()),
    path('attendance/checkout/',                        CheckOutView.as_view()),
    path('attendance/today/',                           TodayAttendanceView.as_view()),
    path('attendance/my/',                              MyAttendanceView.as_view()),
    path('attendance/all/',                             AllAttendanceView.as_view()),
    path('attendance/regularize/',                      ApplyRegularizationView.as_view()),
    path('attendance/regularize/my/',                   MyRegularizationsView.as_view()),
    path('attendance/regularize/all/',                  AllRegularizationsView.as_view()),
    path('attendance/regularize/<int:pk>/action/',      ApproveRegularizationView.as_view()),
    path('attendance/holidays/',                        HolidayListView.as_view()),
]