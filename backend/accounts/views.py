# /backend/accounts/views.py (최종 수정 완료)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.middleware.csrf import get_token

from .serializers import UserSerializer, MyTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

User = get_user_model() # settings.py의 AUTH_USER_MODEL을 사용합니다.

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """사용자 회원가입 처리"""
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({'message': '회원가입 성공', 'user': serializer.data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token_view(request):
    """
    CSRF 토큰을 쿠키로 설정하고 성공 메시지를 반환합니다.
    React 앱이 GET 요청을 보내 csrftoken 쿠키를 받을 수 있도록 합니다.
    """
    csrf_token = get_token(request) # 요청에서 CSRF 토큰을 가져옵니다. (Django 미들웨어에 의해 설정됨)
    return JsonResponse({"detail": "CSRF cookie set"}, status=status.HTTP_200_OK)

class MyTokenObtainPairView(TokenObtainPairView):
    """
    기본 TokenObtainPairView를 상속받아,
    우리가 만든 MyTokenObtainPairSerializer를 사용하도록 지정합니다.
    이것이 커스텀 토큰 발급을 위한 핵심입니다.
    """
    serializer_class = MyTokenObtainPairSerializer