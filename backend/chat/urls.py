# medical_cdss-happy/backend/medical_cdss/chat/urls.py

from django.urls import path
from .views import MessageListCreateView, MedicalStaffListView

app_name = 'chat'

urlpatterns = [
    # 의료진 목록 조회 (GET): /api/chat/staff/
    path('staff/', MedicalStaffListView.as_view(), name='staff-list'),
    
    # 특정 상대방과의 메시지 목록 조회 (GET) 및 생성 (POST)
    # URL에 상대방의 employee_id를 받습니다.
    # 예: /api/chat/messages/DOC-0002/
    path('messages/<str:other_user_id>/', MessageListCreateView.as_view(), name='message-list-create'),
]