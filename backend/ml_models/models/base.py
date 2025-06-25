# backend/ml_models/models/base.py
from django.db import models
from django.contrib.auth.models import User
import uuid
from django.conf import settings

class PredictionTask(models.Model):
    """AI 예측 작업 기록 (공통)"""
    TASK_TYPE_CHOICES = [
        ('COMPLICATION', '합병증 예측'),
        ('MORTALITY', '사망률 예측'),
        ('SOD2_ASSESSMENT', 'SOD2 항산화 평가'),
        ('IMAGE_SEGMENTATION', '이미지 병변 분할'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', '대기중'),
        ('PROCESSING', '처리중'),
        ('COMPLETED', '완료'),
        ('FAILED', '실패'),
    ]
    
    task_id = models.UUIDField(default=uuid.uuid4, unique=True, verbose_name="작업 ID")
    patient = models.ForeignKey('openmrs_integration.OpenMRSPatient', on_delete=models.CASCADE, verbose_name="환자")
    task_type = models.CharField(max_length=30, choices=TASK_TYPE_CHOICES, verbose_name="작업 유형")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name="상태")
    
    # 입력 데이터
    input_data = models.JSONField(verbose_name="입력 데이터")
    
    # 결과 데이터
    predictions = models.JSONField(null=True, blank=True, verbose_name="예측 결과")
    confidence_scores = models.JSONField(null=True, blank=True, verbose_name="신뢰도 점수")
    
    # 메타 정보
    model_version = models.CharField(max_length=50, verbose_name="모델 버전", blank=True)
    processing_time = models.FloatField(null=True, blank=True, verbose_name="처리 시간(초)")
    error_message = models.TextField(blank=True, verbose_name="오류 메시지")
    
    # 시스템 정보
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="완료일")
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="요청자")
                              
    class Meta:
        verbose_name = "AI 예측 작업"
        verbose_name_plural = "AI 예측 작업"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_task_type_display()} - {self.patient.name} ({self.status})"