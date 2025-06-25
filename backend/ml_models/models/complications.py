# backend/ml_models/models/complications.py  
from django.db import models
from .base import PredictionTask

class ComplicationPrediction(models.Model):
    """합병증 예측 결과 - 실제 pkl 모델 기반"""
    COMPLICATION_CHOICES = [
        ('pneumonia', '폐렴'),                    # pneumonia_final_model.pkl
        ('acute_kidney_injury', '급성 신장 손상'), # acute_kidney_injury_final_model.pkl  
        ('heart_failure', '심부전'),              # heart_failure_final_model.pkl
    ]
    
    RISK_LEVEL_CHOICES = [
        ('LOW', '낮음'),
        ('MEDIUM', '보통'),
        ('HIGH', '높음'),
        ('CRITICAL', '매우 높음'),
    ]
    
    task = models.ForeignKey(PredictionTask, on_delete=models.CASCADE, verbose_name="예측 작업")
    complication_type = models.CharField(max_length=30, choices=COMPLICATION_CHOICES, verbose_name="합병증 유형")
    probability = models.FloatField(verbose_name="발생 확률")
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES, verbose_name="위험도")
    threshold = models.FloatField(verbose_name="임계값")
    
    # 실제 모델 메타데이터에서 가져온 성능 지표
    model_auc = models.FloatField(verbose_name="모델 AUC")
    model_precision = models.FloatField(verbose_name="모델 정밀도") 
    model_recall = models.FloatField(verbose_name="모델 재현율")
    model_f1 = models.FloatField(verbose_name="모델 F1 점수")
    model_type = models.CharField(max_length=50, verbose_name="모델 유형")
    model_strategy = models.CharField(max_length=50, verbose_name="학습 전략")
    
    # 183개 피처 기반 특성 중요도
    important_features = models.JSONField(verbose_name="중요 특성들")
    
    class Meta:
        verbose_name = "합병증 예측"
        verbose_name_plural = "합병증 예측"
        unique_together = ['task', 'complication_type']
    
    def __str__(self):
        return f"{self.get_complication_type_display()} - {self.probability:.2%} 위험"