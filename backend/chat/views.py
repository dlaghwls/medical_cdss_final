# medical_cdss-happy/backend/medical_cdss/chat/views.py

# ★★★ APIView와 Response를 사용하기 위해 임포트 수정 ★★★
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, serializers
# ---

from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
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
        print("\n" + "="*50)
        print("--- [BACKEND] MedicalStaffListView 현장 검증 ---")
        current_user = request.user
        print(f"[1] 현재 로그인한 사용자: {current_user.employee_id} (Role: {current_user.role})")

        try:
            from .constants import STAFF_ROLES
            print(f"[2] 검색할 의료진 역할(from constants.py): {STAFF_ROLES}")
        except ImportError:
            STAFF_ROLES = ['doctor', 'nurse', 'tec']
            print(f"[2] 검색할 의료진 역할(임시 정의): {STAFF_ROLES}")

        all_users = User.objects.all()
        print(f"[3] DB에서 찾은 총 사용자 수: {all_users.count()}명")
        for u in all_users:
            print(f"    - ID: {u.employee_id}, 이름: {u.name}, 역할: {u.role}")

        staff_queryset = User.objects.filter(role__in=STAFF_ROLES)
        print(f"[4] '의료진 역할'로 필터링 후 사용자 수: {staff_queryset.count()}명")

        final_queryset = staff_queryset.exclude(employee_id=current_user.employee_id)
        print(f"[5] '자기 자신' 제외 후 최종 사용자 수: {final_queryset.count()}명")

        print("--- [BACKEND] DEBUG END ---")
        print("="*50 + "\n")

        serializer = StaffSerializer(final_queryset, many=True)
        return Response(serializer.data)