# medical_cdss-happy/backend/medical_cdss/chat/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Message
from .serializers import MessageSerializer, StaffSerializer
from django.contrib.auth import get_user_model
from .constants import STAFF_ROLES # ★★★ 방금 만든 constants.py에서 목록을 임포트합니다. ★★★

User = get_user_model()

# MessageListCreateView는 변경할 필요가 없으므로 그대로 둡니다.
class MessageListCreateView(generics.ListCreateAPIView):
    # ... (이전과 동일한 내용) ...
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


# MedicalStaffListView가 constants.py의 STAFF_ROLES를 사용하도록 수정
class MedicalStaffListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # --- 상세 디버깅 로그 시작 ---
        print("\n" + "="*50)
        print("--- MedicalStaffListView DEBUG START ---")

        # 1. 현재 로그인한 사용자는 누구인가?
        current_user = request.user
        print(f"[1] 현재 로그인한 사용자: {current_user.employee_id} (Role: {current_user.role})")

        # 2. 우리가 찾으려는 의료진 역할 목록은 무엇인가?
        print(f"[2] 검색할 의료진 역할(STAFF_ROLES): {STAFF_ROLES}")

        # 3. 데이터베이스의 모든 사용자 목록을 출력해본다.
        all_users = User.objects.all()
        print(f"[3] DB에 있는 모든 사용자 수: {all_users.count()}명")
        for u in all_users:
            print(f"    - ID: {u.employee_id}, 이름: {u.name}, 역할: {u.role}")

        # 4. '의료진 역할'로만 필터링한 결과는?
        staff_queryset = User.objects.filter(role__in=STAFF_ROLES)
        print(f"[4] '의료진 역할'로 필터링 후 사용자 수: {staff_queryset.count()}명")

        # 5. '자기 자신'을 제외한 최종 결과는?
        final_queryset = staff_queryset.exclude(employee_id=current_user.employee_id)
        print(f"[5] '자기 자신' 제외 후 최종 사용자 수: {final_queryset.count()}명")

        print("--- MedicalStaffListView DEBUG END ---")
        print("="*50 + "\n")
        # --- 상세 디버깅 로그 끝 ---

        # 최종 쿼리셋으로 응답 생성
        serializer = StaffSerializer(final_queryset, many=True)
        return Response(serializer.data)