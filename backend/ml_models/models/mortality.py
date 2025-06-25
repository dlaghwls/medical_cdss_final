# backend/ml_models/models/mortality.py
from django.db import models
from .base import PredictionTask

class StrokeMortalityPrediction(models.Model):
    """뇌졸중 사망률 예측 - stroke_mortality_30day.pkl 기반"""
    
    task = models.OneToOneField(PredictionTask, on_delete=models.CASCADE, verbose_name="예측 작업")
    
    # 30일 사망률 예측 (주 모델)
    mortality_30_day = models.FloatField(verbose_name="30일 사망률 확률")
    mortality_30_day_risk_level = models.CharField(max_length=20, verbose_name="30일 위험도")
    
    # 추가 사망률 예측 (모델이 지원하는 경우)
    mortality_in_hospital = models.FloatField(null=True, blank=True, verbose_name="원내 사망률")
    mortality_90_day = models.FloatField(null=True, blank=True, verbose_name="90일 사망률")
    mortality_1_year = models.FloatField(null=True, blank=True, verbose_name="1년 사망률")
    
    # 뇌졸중 특화 정보
    stroke_type = models.CharField(max_length=30, verbose_name="뇌졸중 유형")
    nihss_score = models.IntegerField(null=True, blank=True, verbose_name="NIHSS 점수")
    reperfusion_treatment = models.BooleanField(default=False, verbose_name="재관류 치료 여부")
    reperfusion_time = models.FloatField(null=True, blank=True, verbose_name="재관류 치료 시간")
    
    # 위험 요인 분석
    risk_factors = models.JSONField(verbose_name="위험 요인들")
    protective_factors = models.JSONField(null=True, blank=True, verbose_name="보호 요인들")
    
    # 모델 성능 정보
    model_confidence = models.FloatField(verbose_name="모델 신뢰도")
    model_auc = models.FloatField(verbose_name="모델 AUC")
    
    # 임상 권장사항
    clinical_recommendations = models.TextField(verbose_name="임상 권장사항")
    monitoring_priority = models.CharField(max_length=20, verbose_name="모니터링 우선순위")
    
    class Meta:
        verbose_name = "뇌졸중 사망률 예측"
        verbose_name_plural = "뇌졸중 사망률 예측"
    
    def __str__(self):
        return f"사망률 예측 - {self.task.patient.name} (30일: {self.mortality_30_day:.2%})"
    
    @property
    def overall_risk_category(self):
        """전체 위험도 분류"""
        if self.mortality_30_day < 0.1:
            return "LOW"
        elif self.mortality_30_day < 0.3:
            return "MODERATE"
        elif self.mortality_30_day < 0.5:
            return "HIGH"
        else:
            return "CRITICAL"