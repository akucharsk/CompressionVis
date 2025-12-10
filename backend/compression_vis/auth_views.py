from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout

class LoginView(APIView):
  def post(self, request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user is not None:
      login(request, user)
      return Response({ "message": "OK" }, status=status.HTTP_200_OK)

    return Response({ "message": "Invalid credentials" }, status=status.HTTP_401_UNAUTHORIZED)

class WhoAmIView(APIView):
  def get(self, request):
    user = request.user
    return Response({
      "username": user.username,
      "isAdmin": user.is_superuser,
    }, status=status.HTTP_200_OK)

class LogoutView(APIView):
  def post(self, request):
    logout(request)
    return Response({ "message": "OK" }, status=status.HTTP_200_OK)
