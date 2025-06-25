from django.db import models
from patients.models import Patient, Visit # Patient, Visit 모델 임포트
from django.conf import settings # settings 임포트 (올바름)

class ClinicalRule(models.Model):
    """임상 의사결정 규칙"""
    RULE_TYPE_CHOICES = [
        ('ALERT', '경고'),
        ('REMINDER', '알림'),
        ('SUGGESTION', '제안'),
        ('GUIDELINE', '가이드라인'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', '낮음'),
        ('MEDIUM', '보통'),
        ('HIGH', '높음'),
        ('CRITICAL', '긴급'),
    ]
    
    # 규칙 기본 정보
    name = models.CharField(max_length=200, verbose_name="규칙명")
    description = models.TextField(verbose_name="설명")
    rule_type = models.CharField(max_length=20, choices=RULE_TYPE_CHOICES, verbose_name="규칙유형")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, verbose_name="우선순위")
    
    # 규칙 조건 (JSON 형태로 저장)
    conditions = models.JSONField(verbose_name="조건", help_text="규칙 적용 조건 (JSON 형태)")
    actions = models.JSONField(verbose_name="액션", help_text="규칙 실행 시 수행할 액션 (JSON 형태)")
    
    # 활성화 상태
    is_active = models.BooleanField(default=True, verbose_name="활성화")
    
    # 적용 대상
    departments = models.CharField(max_length=500, verbose_name="적용 진료과", blank=True)
    age_min = models.IntegerField(verbose_name="최소연령", null=True, blank=True)
    age_max = models.IntegerField(verbose_name="최대연령", null=True, blank=True)
    
    # 시스템 정보
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일")
    # created_by 필드 수정: settings 객체 대신 settings.AUTH_USER_MODEL 문자열 참조
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="생성자", related_name='cdss_rules') # related_name 추가
    
    class Meta:
        verbose_name = "임상규칙"
        verbose_name_plural = "임상규칙"
        ordering = ['-priority', 'name']
    
    def __str__(self):
        return f"[{self.get_priority_display()}] {self.name}"


class CDSSAlert(models.Model):
    """CDSS 알림 기록"""
    ALERT_STATUS_CHOICES = [
        ('PENDING', '대기중'),
        ('ACKNOWLEDGED', '확인됨'),
        ('DISMISSED', '무시됨'),
        ('RESOLVED', '해결됨'),
    ]
    
    # 기본 정보
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, verbose_name="환자")
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, verbose_name="방문", null=True, blank=True)
    rule = models.ForeignKey(ClinicalRule, on_delete=models.CASCADE, verbose_name="적용규칙")
    
    # 알림 내용
    title = models.CharField(max_length=200, verbose_name="제목")
    message = models.TextField(verbose_name="메시지")
    recommendation = models.TextField(verbose_name="권장사항", blank=True)
    
    # 상태 및 처리
    status = models.CharField(max_length=20, choices=ALERT_STATUS_CHOICES, default='PENDING', verbose_name="상태")
    # acknowledged_by 필드 수정: settings 객체 대신 settings.AUTH_USER_MODEL 문자열 참조
    acknowledged_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, 
                                       related_name='acknowledged_alerts', verbose_name="확인자") # related_name 추가
    acknowledged_at = models.DateTimeField(null=True, blank=True, verbose_name="확인시간")
    notes = models.TextField(verbose_name="처리메모", blank=True)
    
    # 시스템 정보
    triggered_at = models.DateTimeField(auto_now_add=True, verbose_name="발생시간")
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name="해결시간")
    
    class Meta:
        verbose_name = "CDSS알림"
        verbose_name_plural = "CDSS알림"
        ordering = ['-triggered_at']
    
    def __str__(self):
        return f"{self.title} - {self.patient.name} ({self.triggered_at.strftime('%Y-%m-%d %H:%M')})"


class DrugInteraction(models.Model):
    """약물 상호작용"""
    SEVERITY_CHOICES = [
        ('MINOR', '경미'),
        ('MODERATE', '중등도'),
        ('MAJOR', '심각'),
        ('CONTRAINDICATED', '금기'),
    ]
    
    # 약물 정보
    drug_a = models.CharField(max_length=200, verbose_name="약물A")
    drug_b = models.CharField(max_length=200, verbose_name="약물B")
    
    # 상호작용 정보
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, verbose_name="심각도")
    description = models.TextField(verbose_name="상호작용 설명")
    mechanism = models.TextField(verbose_name="작용기전", blank=True)
    clinical_effect = models.TextField(verbose_name="임상효과", blank=True)
    management = models.TextField(verbose_name="관리방법", blank=True)
    
    # 시스템 정보
    is_active = models.BooleanField(default=True, verbose_name="활성화")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일")
    
    class Meta:
        verbose_name = "약물상호작용"
        verbose_name_plural = "약물상호작용"
        unique_together = ['drug_a', 'drug_b']
        ordering = ['severity', 'drug_a', 'drug_b']
    
    def __str__(self):
        return f"{self.drug_a} + {self.drug_b} ({self.get_severity_display()})"


class DiagnosisSupport(models.Model):
    """진단 지원 기록"""
    
    # 기본 정보
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, verbose_name="환자")
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, verbose_name="방문")
    
    # 입력 데이터
    symptoms = models.JSONField(verbose_name="증상", help_text="환자 증상 데이터")
    vital_signs = models.JSONField(verbose_name="활력징후", help_text="활력징후 데이터")
    lab_results = models.JSONField(verbose_name="검사결과", help_text="검사결과 데이터", null=True, blank=True)
    
    # AI/ML 분석 결과
    suggested_diagnoses = models.JSONField(verbose_name="제안진단", help_text="AI가 제안한 진단들")
    confidence_scores = models.JSONField(verbose_name="신뢰도점수", help_text="각 진단의 신뢰도")
    reasoning = models.TextField(verbose_name="추론과정", help_text="AI의 추론 과정")
    
    # 의사의 판단
    final_diagnosis = models.TextField(verbose_name="최종진단", blank=True)
    doctor_notes = models.TextField(verbose_name="의사메모", blank=True)
    ai_helpful = models.BooleanField(verbose_name="AI도움여부", null=True, blank=True)
    
    # 시스템 정보
    analyzed_at = models.DateTimeField(auto_now_add=True, verbose_name="분석시간")
    # analyzed_by 필드 수정: settings 객체 대신 settings.AUTH_USER_MODEL 문자열 참조
    analyzed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="요청의사", related_name='diagnosis_supports') # related_name 추가
    
    class Meta:
        verbose_name = "진단지원"
        verbose_name_plural = "진단지원"
        ordering = ['-analyzed_at']
    
    def __str__(self):
        return f"진단지원 - {self.patient.name} ({self.analyzed_at.strftime('%Y-%m-%d %H:%M')})"