# accounts/urls.py
from django.urls import path
from .views import CreateUserView, ListUsersView, MeView, UpdateUserView

urlpatterns = [
    path('users/', ListUsersView.as_view()),
    path('users/create/', CreateUserView.as_view()),
    path('users/me/', MeView.as_view()),
    path('users/<int:pk>/', UpdateUserView.as_view()),
]