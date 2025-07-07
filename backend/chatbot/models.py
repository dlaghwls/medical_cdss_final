# 파일 경로: /home/shared/medical_cdss/backend/chatbot/models.py

import uuid
from django.db import models

# OpenMRSPatient 모델 임포트: 'openmrs_integration' 앱에서 가져옵니다.
from openmrs_integration.models import OpenMRSPatient

class ChatSession(models.Model):
    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # 이 채팅 세션이 어떤 환자와 관련된 것인지 명확히 연결합니다.
    # 기존 'identifier' 필드를 제거하고 이 'patient' ForeignKey로 대체합니다.
    patient = models.ForeignKey(
        OpenMRSPatient,
        on_delete=models.CASCADE, # 환자 삭제 시 채팅 세션도 삭제
        related_name="chat_sessions", # OpenMRSPatient 객체에서 이 채팅 세션들을 역참조할 때 사용 (예: patient_obj.chat_sessions.all())
        help_text="The patient associated with this chat session."
    )

    source_table = models.CharField(max_length=100, help_text="e.g., 'gene_ai_result', 'diagnosis_ai_result'")
    # source_id = models.UUIDField(help_text="UUID of the record in source_table (e.g., gene_ai_result.id)")
    # 
    source_id = models.CharField(max_length=50, help_text="ID of the record in source_table (can be int or UUID)")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        patient_info = self.patient.display_name if self.patient and self.patient.display_name else (str(self.patient.uuid) if self.patient else "Unknown Patient")
        return f"Chat Session {self.session_id} for {patient_info} (from {self.source_table}:{self.source_id})"

    class Meta:
        verbose_name = "Chat Session"
        verbose_name_plural = "Chat Sessions"
        ordering = ['-created_at']


class ChatMessage(models.Model):
    message_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages")
    sender = models.CharField(max_length=10)  # 'user' or 'bot'
    content = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.sender}] {self.content[:20]}..."

    class Meta:
        verbose_name = "Chat Message"
        verbose_name_plural = "Chat Messages"
        ordering = ['sent_at']
