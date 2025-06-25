# medical_cdss-happy/backend/medical_cdss/chat/models.py

from django.db import models
from django.conf import settings # settings.AUTH_USER_MODEL을 사용하기 위함
import uuid

class Message(models.Model):
    """
    두 사용자 간의 개별 메시지 (폴링 방식용)
    """
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # sender와 receiver를 직접 ForeignKey로 연결
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_messages_polling', on_delete=models.CASCADE)
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_messages_polling', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True) # 자동으로 현재 시간 저장
    is_read = models.BooleanField(default=False) # 읽음 여부

    class Meta:
        ordering = ['timestamp'] # 메시지를 시간 순서로 정렬

    def __str__(self):
        return f"From {self.sender.username} to {self.receiver.username}: {self.content[:30]}..."