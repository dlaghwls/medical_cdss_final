# backend/accounts/urls.py
from django.urls import path
from . import views # accounts 앱의 views.py에서 뷰 함수를 임포트

# DRF Simple JWT의 기본 토큰 발급 뷰도 추가 (settings.py에서 MyTokenObtainPairSerializer를 사용하도록 설정했으므로)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # 회원가입 API 엔드포인트
    path('register/', views.register_user, name='register_user'), # ⭐ 이 부분이 중요합니다!

    # JWT 토큰 발급 엔드포인트 (기존 로그인 API와 분리 또는 대체)
    # settings.py에서 'TOKEN_OBTAIN_SERIALIZER'를 'accounts.serializers.MyTokenObtainPairSerializer'로 설정했으므로
    # 이 뷰가 실제 로그인 처리 시 사용될 것입니다.
    path('token/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'), # 로그인 시 토큰 발급
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # 토큰 갱신
    path('csrf/', views.get_csrf_token_view, name='csrf_token'),
    # 기타 accounts 앱 관련 URL (필요시 추가)
    # path('profile/', views.user_profile, name='user_profile'),
]