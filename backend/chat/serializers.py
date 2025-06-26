# /backend/chat/serializers.py (최종 수정 완료)

from rest_framework import serializers
from .models import Message
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


# 1. 메시지 안에서 사용할 간단한 유저 정보 Serializer
# (오류 방지를 위해 unread_count 필드가 없습니다.)
class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['employee_id', 'name']


# 2. 의료진 목록에 사용할 Serializer
# (view에서 계산된 unread_count 값을 받기 위해 명시적으로 필드를 선언합니다.)
class StaffSerializer(serializers.ModelSerializer):
    unread_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = User
        fields = ['employee_id', 'name', 'department', 'role', 'unread_count']


# 3. MessageSerializer가 새로 만든 SimpleUserSerializer를 사용하도록 변경
class MessageSerializer(serializers.ModelSerializer):
    sender = SimpleUserSerializer(read_only=True)
    receiver = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['uuid', 'sender', 'receiver', 'content', 'timestamp', 'is_read']
        read_only_fields = ['uuid', 'sender', 'receiver', 'timestamp', 'is_read']


# 이 Serializer는 accounts 앱에 있는 것이 더 적절하지만, 기능상 문제는 없습니다.
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['employee_id'] = user.employee_id
        token['name'] = user.name
        token['department'] = user.department
        token['role'] = user.role
        return token
