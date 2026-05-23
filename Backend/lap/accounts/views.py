# accounts/views.py
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

# ✅ make_permission only — no HasPermission
from utils.permissions import make_permission, IsAuthenticatedUser
from .models import User
from .serializers import MyTokenObtainPairSerializer, CreateUserSerializer, UserSerializer


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class CreateUserView(generics.CreateAPIView):
    serializer_class = CreateUserSerializer
    permission_classes = [make_permission('create_user')]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ListUsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [make_permission('view_users')]

    def get_queryset(self):
        role = self.request.query_params.get('role')
        qs = User.objects.all().order_by('-date_joined')
        if role:
            qs = qs.filter(role=role)
        return qs


class MeView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UpdateUserView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [make_permission('edit_user')]