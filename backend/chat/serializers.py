# medical_cdss-happy/backend/medical_cdss/chat/serializers.py

from rest_framework import serializers
from .models import Message
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['employee_id', 'name', 'department', 'role']
        read_only_fields = fields

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['employee_id'] = user.employee_id
        token['name'] = user.name
        token['department'] = user.department
        token['role'] = user.role
        return token

class MessageSerializer(serializers.ModelSerializer):
    sender = StaffSerializer(read_only=True)
    receiver = StaffSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['uuid', 'sender', 'receiver', 'content', 'timestamp', 'is_read']
        read_only_fields = ['uuid', 'sender', 'receiver', 'timestamp', 'is_read']