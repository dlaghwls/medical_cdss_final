#backend/patients/models.py
from django.db import models
from django.conf import settings


class Doctor(models.Model):
    """의사 정보"""
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=100, blank=True)
    contact = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.name


class Patient(models.Model):
    """환자 기본 정보 + 입원 및 보호자 정보"""
    GENDER_CHOICES = [
        ('M', '남성'),
        ('F', '여성'),
        ('O', '기타'),
    ]
    
    # OpenMRS 연동용 ID
    openmrs_patient_id = models.CharField(max_length=100, unique=True, null=True, blank=True)

    # 기본 정보
    patient_id = models.CharField(max_length=20, unique=True, verbose_name="환자번호")
    name = models.CharField(max_length=100, verbose_name="이름")
    birth_date = models.DateField(verbose_name="생년월일")
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name="성별")
    phone = models.CharField(max_length=20, verbose_name="전화번호", blank=True)
    email = models.EmailField(verbose_name="이메일", blank=True)
    address = models.TextField(verbose_name="주소", blank=True)

    # 보호자 정보
    guardian_name = models.CharField(max_length=100, verbose_name="보호자 이름", blank=True)
    guardian_contact = models.CharField(max_length=20, verbose_name="보호자 연락처", blank=True)
    guardian_relation = models.CharField(max_length=50, verbose_name="보호자 관계", blank=True)

    # 입원 관련
    admission_date = models.DateField(verbose_name="입원일", null=True, blank=True)
    diagnosis = models.CharField(max_length=200, verbose_name="진단명", blank=True, null=True)
    insurance_type = models.CharField(max_length=50, verbose_name="보험종류", blank=True)
    medical_history = models.TextField(verbose_name="병력", blank=True)
    special_notes = models.TextField(verbose_name="특이사항", blank=True)

    # 의료 정보
    blood_type = models.CharField(max_length=5, verbose_name="혈액형", blank=True)
    allergies = models.TextField(verbose_name="알레르기", blank=True)

    # 연결 정보
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="담당의")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="등록자")

    # 시스템 정보
    registration_date = models.DateField(auto_now_add=True, verbose_name="등록일")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "환자"
        verbose_name_plural = "환자"
        ordering = ['-registration_date']

    def __str__(self):
        return f"{self.patient_id} - {self.name}"

    @property
    def age(self):
        """나이 계산"""
        from datetime import date
        today = date.today()
        return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))


class Visit(models.Model):
    """환자 방문 기록"""
    VISIT_TYPE_CHOICES = [
        ('OUTPATIENT', '외래'),
        ('INPATIENT', '입원'),
        ('EMERGENCY', '응급'),
    ]

    STATUS_CHOICES = [
        ('SCHEDULED', '예약'),
        ('IN_PROGRESS', '진료중'),
        ('COMPLETED', '완료'),
        ('CANCELLED', '취소'),
    ]

    openmrs_visit_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, verbose_name="환자")
    visit_number = models.CharField(max_length=20, unique=True, verbose_name="방문번호")
    visit_type = models.CharField(max_length=20, choices=VISIT_TYPE_CHOICES, verbose_name="방문유형")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, verbose_name="상태")

    visit_date = models.DateTimeField(verbose_name="방문일시")
    end_date = models.DateTimeField(null=True, blank=True, verbose_name="종료일시")

    attending_doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="담당의")
    department = models.CharField(max_length=100, verbose_name="진료과", blank=True)

    chief_complaint = models.TextField(verbose_name="주호소", blank=True)
    diagnosis = models.TextField(verbose_name="진단", blank=True)
    treatment_plan = models.TextField(verbose_name="치료계획", blank=True)
    notes = models.TextField(verbose_name="특이사항", blank=True)

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="등록일")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일")

    class Meta:
        verbose_name = "방문"
        verbose_name_plural = "방문"
        ordering = ['-visit_date']

    def __str__(self):
        return f"{self.visit_number} - {self.patient.name} ({self.visit_date.strftime('%Y-%m-%d')})"


class VitalSigns(models.Model):
    """활력 징후"""
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, verbose_name="방문")

    systolic_bp = models.IntegerField(verbose_name="수축기혈압", null=True, blank=True)
    diastolic_bp = models.IntegerField(verbose_name="이완기혈압", null=True, blank=True)
    heart_rate = models.IntegerField(verbose_name="심박수", null=True, blank=True)
    temperature = models.DecimalField(max_digits=4, decimal_places=1, verbose_name="체온", null=True, blank=True)
    respiratory_rate = models.IntegerField(verbose_name="호흡수", null=True, blank=True)
    oxygen_saturation = models.IntegerField(verbose_name="산소포화도", null=True, blank=True)
    height = models.DecimalField(max_digits=5, decimal_places=1, verbose_name="키(cm)", null=True, blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=1, verbose_name="체중(kg)", null=True, blank=True)

    measured_at = models.DateTimeField(auto_now_add=True, verbose_name="측정시간")
    measured_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="측정자",
        related_name="patient_vitalsigns"
    )

    class Meta:
        verbose_name = "활력징후"
        verbose_name_plural = "활력징후"
        ordering = ['-measured_at']

    def __str__(self):
        return f"{self.visit.patient.name} - {self.measured_at.strftime('%Y-%m-%d %H:%M')}"

    @property
    def bmi(self):
        """BMI 계산"""
        if self.height and self.weight:
            height_m = float(self.height) / 100
            return round(float(self.weight) / (height_m ** 2), 1)
        return None


class NurseInitialAssessment(models.Model):
    """간호 초기 평가"""
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE)
    blood_pressure = models.CharField(max_length=20)
    pulse = models.IntegerField()
    respiration = models.IntegerField()
    temperature = models.FloatField()
    spo2 = models.IntegerField(blank=True, null=True)
    consciousness = models.CharField(max_length=20)
    height = models.IntegerField()
    weight = models.IntegerField()
    bmi = models.FloatField()
    skin_condition = models.CharField(max_length=100)
    pain_info = models.CharField(max_length=100)
    diseases = models.TextField()
    current_medications = models.TextField(blank=True)
    drug_allergies = models.TextField(blank=True)
    mobility = models.CharField(max_length=20)
    eating = models.CharField(max_length=20)
    excretion = models.CharField(max_length=20)
    communication = models.CharField(max_length=20)
    vision_hearing = models.CharField(max_length=20)
    fall_risk = models.CharField(max_length=20)
    infection_history = models.CharField(max_length=100, blank=True)
    isolation_required = models.CharField(max_length=100, blank=True)
    understanding_level = models.CharField(max_length=100, blank=True)
    education_needs = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "간호 초기 평가"
        verbose_name_plural = "간호 초기 평가"

    def __str__(self):
        return f"초기평가 - {self.patient.name}"

# 6월 16일 Flutter 관련
# class Prediction(models.Model):
#     patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='predictions')
#     score = models.FloatField()
#     risk_level = models.CharField(max_length=50)
#     predicted_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"{self.patient.name} - {self.score}"

# class Segmentation(models.Model):
#     patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='segmentations')
#     image = models.ImageField(upload_to='segmentations/')
#     uploaded_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"Segmentation - {self.patient.name}"

# class Comment(models.Model):
#     patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='comments')
#     author = models.CharField(max_length=100)
#     content = models.TextField()
#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         ordering = ['-created_at']

#     def __str__(self):
#         return f"{self.patient.name} - {self.author}"




#------------------------------------------------------------------------------------#
# from django.db import models
# from django.conf import settings # settings 임포트 (올바름)

# class Patient(models.Model):
#     """환자 기본 정보"""
#     GENDER_CHOICES = [
#         ('M', '남성'),
#         ('F', '여성'),
#         ('O', '기타'),
#     ]
    
#     # OpenMRS 연동용 ID
#     openmrs_patient_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    
#     # 기본 정보
#     patient_id = models.CharField(max_length=20, unique=True, verbose_name="환자번호")
#     name = models.CharField(max_length=100, verbose_name="이름")
#     birth_date = models.DateField(verbose_name="생년월일")
#     gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name="성별")
#     phone = models.CharField(max_length=20, verbose_name="전화번호", blank=True)
#     email = models.EmailField(verbose_name="이메일", blank=True)
#     address = models.TextField(verbose_name="주소", blank=True)
    
#     # 의료 정보
#     blood_type = models.CharField(max_length=5, verbose_name="혈액형", blank=True)
#     allergies = models.TextField(verbose_name="알레르기", blank=True)
#     medical_history = models.TextField(verbose_name="병력", blank=True)
    
#     # 시스템 정보
#     created_at = models.DateTimeField(auto_now_add=True, verbose_name="등록일")
#     updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일")
#     # created_by 필드 수정: settings 객체 대신 settings.AUTH_USER_MODEL 문자열 참조
#     created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="등록자")
    
#     class Meta:
#         verbose_name = "환자"
#         verbose_name_plural = "환자"
#         ordering = ['-created_at']
    
#     def __str__(self):
#         return f"{self.patient_id} - {self.name}"
    
#     @property
#     def age(self):
#         """나이 계산"""
#         from datetime import date
#         today = date.today()
#         return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))


# class Visit(models.Model):
#     """환자 방문 기록"""
#     VISIT_TYPE_CHOICES = [
#         ('OUTPATIENT', '외래'),
#         ('INPATIENT', '입원'),
#         ('EMERGENCY', '응급'),
#     ]
    
#     STATUS_CHOICES = [
#         ('SCHEDULED', '예약'),
#         ('IN_PROGRESS', '진료중'),
#         ('COMPLETED', '완료'),
#         ('CANCELLED', '취소'),
#     ]
    
#     # OpenMRS 연동용 ID
#     openmrs_visit_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    
#     # 기본 정보
#     patient = models.ForeignKey(Patient, on_delete=models.CASCADE, verbose_name="환자")
#     visit_number = models.CharField(max_length=20, unique=True, verbose_name="방문번호")
#     visit_type = models.CharField(max_length=20, choices=VISIT_TYPE_CHOICES, verbose_name="방문유형")
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, verbose_name="상태")
    
#     # 일정 정보
#     visit_date = models.DateTimeField(verbose_name="방문일시")
#     end_date = models.DateTimeField(null=True, blank=True, verbose_name="종료일시")
    
#     # 의료진 정보
#     # attending_doctor 필드 수정: settings 객체 대신 settings.AUTH_USER_MODEL 문자열 참조
#     attending_doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="담당의")
#     department = models.CharField(max_length=100, verbose_name="진료과", blank=True)
    
#     # 진료 정보
#     chief_complaint = models.TextField(verbose_name="주호소", blank=True)
#     diagnosis = models.TextField(verbose_name="진단", blank=True)
#     treatment_plan = models.TextField(verbose_name="치료계획", blank=True)
#     notes = models.TextField(verbose_name="특이사항", blank=True)
    
#     # 시스템 정보
#     created_at = models.DateTimeField(auto_now_add=True, verbose_name="등록일")
#     updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일")
    
#     class Meta:
#         verbose_name = "방문"
#         verbose_name_plural = "방문"
#         ordering = ['-visit_date']
    
#     def __str__(self):
#         return f"{self.visit_number} - {self.patient.name} ({self.visit_date.strftime('%Y-%m-%d')})"


# class VitalSigns(models.Model):
#     """활력 징후"""
#     visit = models.ForeignKey(Visit, on_delete=models.CASCADE, verbose_name="방문")
    
#     # 활력 징후 측정값
#     systolic_bp = models.IntegerField(verbose_name="수축기혈압", null=True, blank=True)
#     diastolic_bp = models.IntegerField(verbose_name="이완기혈압", null=True, blank=True)
#     heart_rate = models.IntegerField(verbose_name="심박수", null=True, blank=True)
#     temperature = models.DecimalField(max_digits=4, decimal_places=1, verbose_name="체온", null=True, blank=True)
#     respiratory_rate = models.IntegerField(verbose_name="호흡수", null=True, blank=True)
#     oxygen_saturation = models.IntegerField(verbose_name="산소포화도", null=True, blank=True)
#     height = models.DecimalField(max_digits=5, decimal_places=1, verbose_name="키(cm)", null=True, blank=True)
#     weight = models.DecimalField(max_digits=5, decimal_places=1, verbose_name="체중(kg)", null=True, blank=True)
    
#     # 측정 정보
#     measured_at = models.DateTimeField(auto_now_add=True, verbose_name="측정시간")
#     # measured_by 필드 수정: settings 객체 대신 settings.AUTH_USER_MODEL 문자열 참조
#     measured_by = models.ForeignKey(
#         settings.AUTH_USER_MODEL, 
#         on_delete=models.SET_NULL, 
#         null=True, 
#         verbose_name="측정자",
#         related_name="patient_vitalsigns"
#     )
    
#     class Meta:
#         verbose_name = "활력징후"
#         verbose_name_plural = "활력징후"
#         ordering = ['-measured_at']
    
#     def __str__(self):
#         return f"{self.visit.patient.name} - {self.measured_at.strftime('%Y-%m-%d %H:%M')}"
    
#     @property
#     def bmi(self):
#         """BMI 계산"""
#         if self.height and self.weight:
#             height_m = float(self.height) / 100
#             return round(float(self.weight) / (height_m ** 2), 1)
#         return None
