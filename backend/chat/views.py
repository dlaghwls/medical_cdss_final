# medical_cdss-happy/backend/medical_cdss/chat/views.py

# ★★★ APIView와 Response를 사용하기 위해 임포트 수정 ★★★
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, serializers
# ---

from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q 
from .models import Message
from .serializers import MessageSerializer, StaffSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

# MessageListCreateView는 변경할 필요가 없으므로 그대로 둡니다.
class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        current_user = self.request.user
        other_user_id = self.kwargs.get('other_user_id')

        if not other_user_id:
            return Message.objects.none()

        try:
            other_user = User.objects.get(employee_id=other_user_id)
        except User.DoesNotExist:
            return Message.objects.none()

        queryset = Message.objects.filter(
            Q(sender=current_user, receiver=other_user) |
            Q(sender=other_user, receiver=current_user)
        ).order_by('timestamp')
        
        Message.objects.filter(receiver=current_user, sender=other_user, is_read=False).update(is_read=True)
        return queryset

    def perform_create(self, serializer):
        other_user_id = self.kwargs.get('other_user_id')
        try:
            receiver_user = User.objects.get(employee_id=other_user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"detail": "Receiver not found."})
        
        serializer.save(sender=self.request.user, receiver=receiver_user)


# ======================================================================
# ★★★ 수정된 MedicalStaffListView ★★★
# generics.ListAPIView 대신 APIView를 상속받아 직접 구현합니다.
# ======================================================================
class MedicalStaffListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        current_user = request.user
        
        try:
            from .constants import STAFF_ROLES
        except ImportError:
            STAFF_ROLES = ['doctor', 'nurse', 'tec']

        # 각 staff가 현재 로그인한 유저(current_user)에게 보낸, 
        # 읽지 않은(is_read=False) 메시지의 개수를 계산하여 'unread_count'라는 이름으로 추가합니다.
        staff_queryset = User.objects.filter(
            role__in=STAFF_ROLES
        ).annotate(
            unread_count=Count('sent_messages_polling', filter=Q(
                sent_messages_polling__receiver=current_user, 
                sent_messages_polling__is_read=False
            ))
        ).exclude(
            employee_id=current_user.employee_id
        )

        serializer = StaffSerializer(staff_queryset, many=True)
        return Response(serializer.data)
        
class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        unread_count = Message.objects.filter(receiver=request.user, is_read=False).count()
        return Response({'unread_count': unread_count})