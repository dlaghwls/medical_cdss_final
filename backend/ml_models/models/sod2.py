# backend/ml_models/models/sod2.py
from django.db import models
from .base import PredictionTask

class SOD2Assessment(models.Model):
    """SOD2 항산화 미토콘드리아 평가 - 계산 기반 (tsx 파일 구조 반영)"""
    
    STROKE_TYPE_CHOICES = [
        ('ischemic_reperfusion', '허혈성 뇌졸중 (재관류 치료)'),
        ('ischemic_no_reperfusion', '허혈성 뇌졸중 (보존적 치료)'),
        ('hemorrhagic', '출혈성 뇌졸중'),
    ]
    
    RISK_LEVEL_CHOICES = [
        ('low', '낮음'),
        ('medium', '보통'),  
        ('high', '높음'),
    ]
    
    task = models.OneToOneField(PredictionTask, on_delete=models.CASCADE, verbose_name="평가 작업")
    
    # 환자 기본 정보 (tsx에서 사용되는 필드들)
    age = models.IntegerField(verbose_name="나이")
    gender = models.CharField(max_length=1, verbose_name="성별")
    stroke_type = models.CharField(max_length=30, choices=STROKE_TYPE_CHOICES, verbose_name="뇌졸중 유형")
    stroke_date = models.DateField(verbose_name="뇌졸중 발생일")
    nihss_score = models.IntegerField(verbose_name="NIHSS 점수")
    
    # 재관류 치료 정보
    reperfusion_treatment = models.BooleanField(default=False, verbose_name="재관류 치료 여부")
    reperfusion_time = models.FloatField(null=True, blank=True, verbose_name="재관류 치료 시간(시간)")
    
    # 현재 상태
    hours_after_stroke = models.FloatField(verbose_name="뇌졸중 후 경과 시간(시간)")
    current_sod2_level = models.FloatField(verbose_name="현재 SOD2 수준")
    
    # SOD2 예측 데이터 (시계열)
    sod2_prediction_data = models.JSONField(verbose_name="SOD2 예측 시계열 데이터")
    
    # 위험도 평가
    oxidative_stress_risk = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES, verbose_name="산화 스트레스 위험도")
    prediction_confidence = models.FloatField(verbose_name="예측 신뢰도")
    
    # 운동 권장사항 (tsx 파일의 getExerciseRecommendation 기반)
    exercise_can_start = models.BooleanField(verbose_name="운동 시작 가능 여부")
    exercise_intensity = models.IntegerField(default=0, verbose_name="권장 운동 강도(%)")
    exercise_start_time = models.FloatField(null=True, blank=True, verbose_name="운동 시작 권장 시간")
    sod2_target_level = models.FloatField(verbose_name="목표 SOD2 수준")
    
    # 개인화 조정 요인들
    age_adjustment_factor = models.FloatField(default=1.0, verbose_name="연령 조정 계수")
    stroke_type_adjustment = models.FloatField(default=1.0, verbose_name="뇌졸중 유형 조정")
    nihss_adjustment = models.FloatField(default=1.0, verbose_name="NIHSS 조정 계수")
    reperfusion_timing_adjustment = models.FloatField(default=1.0, verbose_name="재관류 시점 조정")
    
    # 동반질환 및 약물
    comorbidities = models.JSONField(default=list, verbose_name="동반질환")
    current_medications = models.JSONField(default=list, verbose_name="현재 복용 약물")
    
    # 권장사항
    clinical_recommendations = models.TextField(verbose_name="임상 권장사항")
    exercise_recommendations = models.TextField(verbose_name="운동 권장사항")
    monitoring_schedule = models.TextField(verbose_name="모니터링 일정")
    
    class Meta:
        verbose_name = "SOD2 항산화 평가"
        verbose_name_plural = "SOD2 항산화 평가"
    
    def __str__(self):
        return f"SOD2 평가 - {self.task.patient.name} (수준: {self.current_sod2_level:.2%})"
    
    @property
    def overall_antioxidant_status(self):
        """전반적인 항산화 상태"""
        if self.current_sod2_level >= 0.95:
            return "우수"
        elif self.current_sod2_level >= 0.85:
            return "양호"
        elif self.current_sod2_level >= 0.7:
            return "보통"
        elif self.current_sod2_level >= 0.5:
            return "주의"
        else:
            return "위험"
    
    @property
    def time_until_exercise(self):
        """운동 시작까지 남은 시간"""
        if self.exercise_can_start:
            return 0
        
        base_times = {
            'ischemic_reperfusion': 72,
            'ischemic_no_reperfusion': 96, 
            'hemorrhagic': 120
        }
        
        required_time = base_times.get(self.stroke_type, 96)
        return max(0, required_time - self.hours_after_stroke)