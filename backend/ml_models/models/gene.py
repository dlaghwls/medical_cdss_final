# 파일 경로: /home/shared/medical_cdss/backend/ml_models/models/gene.py

import uuid
from django.db import models

# OpenMRSPatient 모델 임포트: 'openmrs_integration' 앱에서 가져옵니다.
from openmrs_integration.models import OpenMRSPatient

class geneAIResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # 이 AI 결과가 어떤 환자의 것인지 명확히 연결합니다.
    # 기존 'identifier' 필드를 제거하고 이 'patient' ForeignKey로 대체합니다.
    patient = models.ForeignKey(
        OpenMRSPatient,
        on_delete=models.CASCADE,  # 환자 삭제 시 해당 AI 결과도 함께 삭제
        related_name="gene_ai_results", # OpenMRSPatient 객체에서 이 AI 결과들을 역참조할 때 사용 (예: patient_obj.gene_ai_results.all())
        help_text="The patient this AI result belongs to."
    )

    confidence_score = models.FloatField()
    model_name = models.CharField(max_length=128)
    model_version = models.CharField(max_length=32, blank=True, null=True) # blank=True와 함께 null=True 권장
    result_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # self.patient가 None일 경우를 대비하여 조건문 추가 (데이터 무결성 문제 시)
        patient_info = self.patient.display_name if self.patient and self.patient.display_name else (str(self.patient.uuid) if self.patient else "Unknown Patient")
        return f"Gene AI Result for {patient_info} ({self.model_name}) - {self.confidence_score:.3f}"

    class Meta:
        verbose_name = "Gene AI Result"
        verbose_name_plural = "Gene AI Results"
        ordering = ['-created_at'] # 가장 최신 결과가 위로 오도록 정렬