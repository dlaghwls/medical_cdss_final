# backend/ml_models/models.py
from django.db import models
from django.conf import settings # ★★★ settings를 임포트합니다. ★★★
import uuid

class PredictionTask(models.Model):
    """AI 예측 작업 기록 - 핵심 기능만"""
    
    TASK_TYPE_CHOICES = [
        ('COMPLICATION', '합병증 예측'),
        ('MORTALITY', '사망률 예측'),
        ('SOD2_ASSESSMENT', 'SOD2 항산화 평가'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', '대기중'),
        ('PROCESSING', '처리중'),
        ('COMPLETED', '완료'),
        ('FAILED', '실패'),
    ]
    
    task_id = models.UUIDField(unique=True, verbose_name="작업 ID")
    patient = models.ForeignKey('openmrs_integration.OpenMRSPatient', on_delete=models.CASCADE, verbose_name="환자")
    
    task_type = models.CharField(max_length=30, choices=TASK_TYPE_CHOICES, verbose_name="작업 유형")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, 
                             default='PENDING', verbose_name="상태")
    
    input_data = models.JSONField(verbose_name="입력 데이터")
    predictions = models.JSONField(null=True, blank=True, verbose_name="예측 결과")
    
    processing_time = models.FloatField(null=True, blank=True, verbose_name="처리 시간(초)")
    error_message = models.TextField(blank=True, verbose_name="오류 메시지")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="완료일")
    
    # 요청자 (User 모델 참조)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, # ★★★ 이 부분이 settings.AUTH_USER_MODEL로 되어 있어야 합니다. ★★★
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='prediction_tasks',
        verbose_name="요청자"
    )
    
    class Meta:
        verbose_name = "AI 예측 작업"
        verbose_name_plural = "AI 예측 작업"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', '-created_at']),
            models.Index(fields=['task_type', 'status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        requester_display = self.requested_by.display_name if self.requested_by else '알 수 없음'
        return f"{self.get_task_type_display()} - {self.patient.display_name} ({self.status}) by {requester_display}"
    
    @property
    def is_completed(self):
        return self.status == 'COMPLETED'
    
    @property
    def is_failed(self):
        return self.status == 'FAILED'
    
    @property
    def is_processing(self):
        return self.status in ['PENDING', 'PROCESSING']


class ComplicationPrediction(models.Model):
    """합병증 예측 결과"""
    patient = models.ForeignKey('openmrs_integration.OpenMRSPatient', on_delete=models.CASCADE, verbose_name="환자")
    prediction_type = models.CharField(max_length=50, verbose_name="예측 유형")
    input_data = models.JSONField(verbose_name="입력 데이터")
    results = models.JSONField(verbose_name="예측 결과")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, # ★★★ 이 부분이 settings.AUTH_USER_MODEL로 되어 있어야 합니다. ★★★
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='created_complication_predictions',
        verbose_name="생성자"
    )
    
    class Meta:
        verbose_name = "합병증 예측"
        verbose_name_plural = "합병증 예측"
        ordering = ['-created_at']

class StrokeMortalityPrediction(models.Model):
    """뇌졸중 사망률 예측 결과"""
    patient = models.ForeignKey('openmrs_integration.OpenMRSPatient', on_delete=models.CASCADE, verbose_name="환자")
    input_data = models.JSONField(verbose_name="입력 데이터")
    mortality_probability = models.FloatField(verbose_name="사망 확률")
    risk_factors = models.JSONField(verbose_name="위험 요소")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, # ★★★ 이 부분이 settings.AUTH_USER_MODEL로 되어 있어야 합니다. ★★★
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='created_stroke_mortality_predictions',
        verbose_name="생성자"
    )
    
    class Meta:
        verbose_name = "뇌졸중 사망률 예측"
        verbose_name_plural = "뇌졸중 사망률 예측"
        ordering = ['-created_at']

class SOD2Assessment(models.Model):
    """SOD2 항산화 평가 결과"""
    task = models.OneToOneField(PredictionTask, on_delete=models.CASCADE, verbose_name="예측 작업")
    
    age = models.IntegerField(verbose_name="나이")
    gender = models.CharField(max_length=10, verbose_name="성별")
    
    stroke_type = models.CharField(max_length=50, verbose_name="뇌졸중 유형")
    stroke_date = models.DateField(null=True, blank=True, verbose_name="뇌졸중 발생일")
    nihss_score = models.IntegerField(verbose_name="NIHSS 점수")
    reperfusion_treatment = models.BooleanField(default=False, verbose_name="재관류 치료")
    reperfusion_time = models.IntegerField(null=True, blank=True, verbose_name="재관류 시간(분)")
    hours_after_stroke = models.FloatField(verbose_name="뇌졸중 후 경과 시간(시간)")
    
    current_sod2_level = models.FloatField(verbose_name="현재 SOD2 수치")
    sod2_prediction_data = models.JSONField(verbose_name="SOD2 예측 데이터")
    oxidative_stress_risk = models.CharField(max_length=20, verbose_name="산화 스트레스 위험도")
    prediction_confidence = models.FloatField(verbose_name="예측 신뢰도")
    
    exercise_can_start = models.BooleanField(verbose_name="운동 시작 가능")
    exercise_intensity = models.FloatField(verbose_name="운동 강도")
    exercise_start_time = models.CharField(max_length=50, null=True, blank=True, verbose_name="운동 시작 시기")
    sod2_target_level = models.FloatField(verbose_name="SOD2 목표 수치")
    
    age_adjustment_factor = models.FloatField(verbose_name="연령 보정 인수")
    stroke_type_adjustment = models.FloatField(verbose_name="뇌졸중 유형 보정")
    nihss_adjustment = models.FloatField(verbose_name="NIHSS 보정")
    reperfusion_timing_adjustment = models.FloatField(default=1.0, verbose_name="재관류 타이밍 보정")
    
    clinical_recommendations = models.TextField(verbose_name="임상 권장사항")
    exercise_recommendations = models.JSONField(verbose_name="운동 권장사항")
    monitoring_schedule = models.JSONField(verbose_name="모니터링 일정")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, # ★★★ 이 부분이 settings.AUTH_USER_MODEL로 되어 있어야 합니다. ★★★
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='created_sod2_assessments',
        verbose_name="생성자"
    )
    
    class Meta:
        verbose_name = "SOD2 항산화 평가"
        verbose_name_plural = "SOD2 항산화 평가"
        ordering = ['-created_at']
    
    def __str__(self):
        creator_display = self.created_by.display_name if self.created_by else '알 수 없음'
        return f"SOD2 평가 - {self.task.patient.display_name} ({self.created_at.strftime('%Y-%m-%d')}) by {creator_display}"
    
    @property
    def overall_antioxidant_status(self):
        """전체 항산화 상태 평가"""
        if self.current_sod2_level >= self.sod2_target_level:
            return "GOOD"
        elif self.current_sod2_level >= self.sod2_target_level * 0.8:
            return "MODERATE"
        else:
            return "POOR"

class geneAIResult(models.Model):
    """Gene AI 분석 결과"""
    patient = models.ForeignKey('openmrs_integration.OpenMRSPatient', on_delete=models.CASCADE, related_name='gene_ai_results', help_text='The patient this AI result belongs to.')
    identifier = models.CharField(max_length=100, verbose_name="식별자")
    confidence_score = models.FloatField(null=True, blank=True, verbose_name="신뢰도 점수")
    model_name = models.CharField(max_length=100, blank=True, verbose_name="모델명")
    model_version = models.CharField(max_length=50, blank=True, verbose_name="모델 버전")
    result_text = models.TextField(blank=True, verbose_name="결과 텍스트")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일")
    
    # geneAIResult에도 생성자 필드를 추가할 수 있습니다. (주석 처리된 채로 유지)
    # created_by = models.ForeignKey(
    #     settings.AUTH_USER_MODEL,
    #     on_delete=models.SET_NULL,
    #     null=True, blank=True,
    #     related_name='created_gene_ai_results',
    #     verbose_name="생성자"
    # )
    
    class Meta:
        verbose_name = "Gene AI 결과"
        verbose_name_plural = "Gene AI 결과"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Gene AI - {self.identifier} ({self.confidence_score})"

