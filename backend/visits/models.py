from django.db import models
from patients.models import Patient
from django.conf import settings # settings 임포트 (올바름)

class VisitType(models.Model):
    """방문 유형 (외래, 입원, 응급실 등)"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "방문 유형"
        verbose_name_plural = "방문 유형들"


class Visit(models.Model):
    """환자 방문 기록"""
    VISIT_STATUS_CHOICES = [
        ('scheduled', '예약됨'),
        ('checked_in', '접수완료'),
        ('in_progress', '진행중'),
        ('completed', '완료'),
        ('cancelled', '취소'),
        ('no_show', '노쇼'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='visits')
    visit_type = models.ForeignKey(VisitType, on_delete=models.CASCADE)
    
    # 방문 일정
    scheduled_datetime = models.DateTimeField()
    actual_start_datetime = models.DateTimeField(null=True, blank=True)
    actual_end_datetime = models.DateTimeField(null=True, blank=True)
    
    # 상태
    status = models.CharField(max_length=20, choices=VISIT_STATUS_CHOICES, default='scheduled')
    
    # 담당 의료진
    # attending_doctor 필드 수정: settings 객체 대신 settings.AUTH_USER_MODEL 문자열 참조
    attending_doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, # ★★★ 수정됨 ★★★
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='doctor_visits'
    )
    
    # 방문 정보
    chief_complaint = models.TextField("주호소", blank=True) 
    visit_notes = models.TextField("방문 메모", blank=True)
    
    # 위치 정보
    department = models.CharField("진료과", max_length=100, blank=True)
    room_number = models.CharField("진료실", max_length=50, blank=True)
    
    # 메타 정보
    # created_by 필드 (추가됨): settings 객체 대신 settings.AUTH_USER_MODEL 문자열 참조
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_visits') # ★★★ 추가됨 ★★★
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # OpenMRS 연동용 필드
    openmrs_visit_uuid = models.UUIDField(null=True, blank=True, unique=True)
    
    class Meta:
        verbose_name = "방문"
        verbose_name_plural = "방문들"
        ordering = ['-scheduled_datetime']
    
    def __str__(self):
        return f"{self.patient.full_name} - {self.scheduled_datetime.strftime('%Y-%m-%d %H:%M')} ({self.get_status_display()})"
    
    @property
    def duration(self):
        """방문 지속 시간 계산"""
        if self.actual_start_datetime and self.actual_end_datetime:
            return self.actual_end_datetime - self.actual_start_datetime
        return None
    
    @property
    def is_completed(self):
        return self.status == 'completed'
    
    @property
    def is_in_progress(self):
        return self.status == 'in_progress'


class VitalSigns(models.Model): # visits 앱의 VitalSigns 모델
    """바이탈 사인 측정 기록"""
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, related_name='vital_signs')
    
    # 기본 바이탈
    systolic_bp = models.IntegerField("수축기 혈압", null=True, blank=True) 
    diastolic_bp = models.IntegerField("이완기 혈압", null=True, blank=True) 
    heart_rate = models.IntegerField("심박수", null=True, blank=True) 
    respiratory_rate = models.IntegerField("호흡수", null=True, blank=True) 
    temperature = models.DecimalField("체온", max_digits=4, decimal_places=1, null=True, blank=True) 
    oxygen_saturation = models.IntegerField("산소포화도", null=True, blank=True) 
    
    # 신체 측정
    height = models.DecimalField("신장", max_digits=5, decimal_places=2, null=True, blank=True) 
    weight = models.DecimalField("체중", max_digits=5, decimal_places=2, null=True, blank=True) 
    
    # 측정 정보
    # measured_by 필드 수정: settings 객체 대신 settings.AUTH_USER_MODEL 문자열 참조
    measured_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, # ★★★ 수정됨 ★★★
        on_delete=models.SET_NULL, 
        null=True, 
        related_name="visit_vitalsigns", # ★★★ related_name은 다른 앱의 models.VitalSigns와 겹치지 않도록 조정 ★★★
        verbose_name="측정자" # verbose_name이 누락되어 추가
    )
    measured_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField("측정 메모", blank=True)
    
    class Meta:
        verbose_name = "바이탈 사인"
        verbose_name_plural = "바이탈 사인들"
        ordering = ['-measured_at']
    
    def __str__(self):
        return f"{self.visit.patient.full_name} - {self.measured_at.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def bmi(self):
        """BMI 계산"""
        if self.height and self.weight:
            height_m = float(self.height) / 100 
            return float(self.weight) / (height_m ** 2)
        return None
    
    @property
    def blood_pressure(self):
        """혈압 문자열 반환"""
        if self.systolic_bp and self.diastolic_bp:
            return f"{self.systolic_bp}/{self.diastolic_bp}"
        return None