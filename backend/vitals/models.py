import uuid
from django.db import models
# [수정] Patient 모델 대신 OpenMRSPatient 모델을 가져옵니다.
from openmrs_integration.models import OpenMRSPatient

class VitalSession(models.Model):
    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # [수정] 관계를 맺는 대상을 OpenMRSPatient로 변경합니다.
    patient = models.ForeignKey(OpenMRSPatient, on_delete=models.CASCADE, related_name='vital_sessions')
    notes = models.TextField(blank=True, null=True, help_text="세션에 대한 종합 비고")
    recorded_at = models.DateTimeField(help_text="세션 기록 시간")

    class Meta:
        ordering = ['-recorded_at']
        verbose_name = "바이탈 측정 세션"
        verbose_name_plural = "바이탈 측정 세션들"

    def __str__(self):
        return f"{self.patient.display_name} at {self.recorded_at.strftime('%Y-%m-%d %H:%M')}"

class VitalMeasurement(models.Model):
    session = models.OneToOneField(VitalSession, on_delete=models.CASCADE, primary_key=True, related_name='measurements')
    bp = models.CharField(max_length=20, verbose_name="혈압 (Blood Pressure)")
    hr = models.PositiveIntegerField(verbose_name="심박수 (Heart Rate)")
    rr = models.PositiveIntegerField(verbose_name="호흡수 (Respiratory Rate)")
    temp = models.DecimalField(max_digits=4, decimal_places=1, verbose_name="체온 (Temperature)")
    spo2 = models.PositiveIntegerField(verbose_name="산소포화도 (SpO2)")

    class Meta:
        verbose_name = "바이탈 측정값"
        verbose_name_plural = "바이탈 측정값들"

    def __str__(self):
        return f"Measurements for Session {self.session.session_id}"