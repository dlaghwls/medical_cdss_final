# backend/lab_results/models.py

from django.db import models
from openmrs_integration.models import OpenMRSPatient # OpenMRSPatient 모델 임포트
from django.utils import timezone

class LabResult(models.Model):
    """
    환자의 LIS (Lab Information System) 검사 결과를 저장하는 모델.
    """
    # OpenMRSPatient와 1:N 관계 (한 환자는 여러 개의 검사 결과를 가질 수 있음)
    patient = models.ForeignKey(
        OpenMRSPatient, # openmrs_integration.OpenMRSPatient 대신 직접 모델 클래스 사용
        on_delete=models.CASCADE,
        related_name='lab_results',
        help_text="검사 결과를 기록한 환자"
    )
    
    # 검사 유형 (예: 혈당, 콜레스테롤, 혈압 등)
    test_name = models.CharField(
        max_length=100,
        help_text="검사 항목명 (예: Glucose, Cholesterol, Blood Pressure SYS/DIA)"
    )
    
    # 검사 수치 (실수 값)
    test_value = models.FloatField(
        help_text="검사 결과 수치"
    )
    
    # 측정 단위 (예: mg/dL, mmHg)
    unit = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="검사 수치의 단위 (예: mg/dL)"
    )
    
    # 검사 결과 기록 날짜 및 시간
    recorded_at = models.DateTimeField(
        auto_now_add=True,
        help_text="검사 결과가 기록된 시점"
    )
    
    # 선택적 필드: 참고 사항
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="검사 결과에 대한 추가 설명"
    )

    class Meta:
        ordering = ['patient', 'test_name', '-recorded_at']
        verbose_name = "실험실 결과"
        verbose_name_plural = "실험실 결과들"

    def __str__(self):
        return f"{self.patient.display_name} - {self.test_name}: {self.test_value} {self.unit or ''} ({self.recorded_at.strftime('%Y-%m-%d')})"
    
# ... 기존 LabResult 모델 아래에 추가 ...

class StrokeInfo(models.Model):
    patient = models.ForeignKey(OpenMRSPatient, on_delete=models.CASCADE, related_name='stroke_infos')
    stroke_info = models.JSONField(help_text="Stroke-related information like type, NIHSS score, etc.")
    notes = models.TextField(blank=True, null=True)
    recorded_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Stroke Info for {self.patient.display_name} at {self.recorded_at.strftime('%Y-%m-%d %H:%M')}"

class Complications(models.Model):
    patient = models.ForeignKey(OpenMRSPatient, on_delete=models.CASCADE, related_name='complications_history')
    complications = models.JSONField(help_text="Complication flags")
    medications = models.JSONField(help_text="Medication flags")
    notes = models.TextField(blank=True, null=True)
    recorded_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Complications for {self.patient.display_name} at {self.recorded_at.strftime('%Y-%m-%d %H:%M')}"