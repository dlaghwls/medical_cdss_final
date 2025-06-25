# backend/patients/admin.py
from django.contrib import admin
from .models import Patient, Doctor, Visit, VitalSigns, NurseInitialAssessment

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['patient_id', 'name', 'gender', 'birth_date', 'registration_date']
    list_filter = ['gender', 'registration_date', 'admission_date']
    search_fields = ['patient_id', 'name', 'phone', 'email', 'openmrs_patient_id']
    readonly_fields = ['registration_date', 'created_at', 'updated_at']
    
    fieldsets = (
        ('기본정보', {
            'fields': ('patient_id', 'name', 'birth_date', 'gender')
        }),
        ('연락처', {
            'fields': ('phone', 'email', 'address'),
        }),
        ('보호자 정보', {
            'fields': ('guardian_name', 'guardian_contact', 'guardian_relation'),
            'classes': ('collapse',)
        }),
        ('의료 정보', {
            'fields': ('blood_type', 'allergies', 'medical_history', 'diagnosis'),
            'classes': ('collapse',)
        }),
        ('입원 정보', {
            'fields': ('admission_date', 'insurance_type', 'special_notes', 'doctor'),
            'classes': ('collapse',)
        }),
        ('OpenMRS 연동', {
            'fields': ('openmrs_patient_id',),
            'classes': ('collapse',)
        }),
        ('시간정보', {
            'fields': ('registration_date', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'contact']
    search_fields = ['name', 'department']
    list_filter = ['department']

@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ['visit_number', 'patient', 'visit_type', 'status', 'visit_date', 'attending_doctor']
    list_filter = ['visit_type', 'status', 'department', 'visit_date']
    search_fields = ['visit_number', 'patient__name', 'patient__patient_id', 'chief_complaint']
    date_hierarchy = 'visit_date'
    
    fieldsets = (
        ('기본정보', {
            'fields': ('patient', 'visit_number', 'visit_type', 'status')
        }),
        ('일정정보', {
            'fields': ('visit_date', 'end_date', 'attending_doctor', 'department')
        }),
        ('진료정보', {
            'fields': ('chief_complaint', 'diagnosis', 'treatment_plan', 'notes')
        }),
        ('OpenMRS 연동', {
            'fields': ('openmrs_visit_id',),
            'classes': ('collapse',)
        }),
    )

@admin.register(VitalSigns)
class VitalSignsAdmin(admin.ModelAdmin):
    list_display = ['visit', 'measured_at', 'systolic_bp', 'diastolic_bp', 'heart_rate', 'temperature', 'bmi']
    list_filter = ['measured_at', 'measured_by']
    search_fields = ['visit__patient__name', 'visit__visit_number']
    date_hierarchy = 'measured_at'
    readonly_fields = ['bmi']
    
    fieldsets = (
        ('방문정보', {
            'fields': ('visit', 'measured_by', 'measured_at')
        }),
        ('활력징후', {
            'fields': ('systolic_bp', 'diastolic_bp', 'heart_rate', 'temperature', 'respiratory_rate', 'oxygen_saturation')
        }),
        ('신체계측', {
            'fields': ('height', 'weight', 'bmi')
        }),
    )

@admin.register(NurseInitialAssessment)
class NurseInitialAssessmentAdmin(admin.ModelAdmin):
    list_display = ['patient', 'blood_pressure', 'pulse', 'temperature', 'created_at']
    search_fields = ['patient__name', 'patient__patient_id']
    list_filter = ['created_at', 'consciousness', 'mobility', 'fall_risk']
    readonly_fields = ['created_at', 'bmi']
    
    fieldsets = (
        ('환자정보', {
            'fields': ('patient',)
        }),
        ('활력징후', {
            'fields': ('blood_pressure', 'pulse', 'respiration', 'temperature', 'spo2')
        }),
        ('신체정보', {
            'fields': ('height', 'weight', 'bmi', 'skin_condition')
        }),
        ('의식/의사소통', {
            'fields': ('consciousness', 'communication', 'vision_hearing')
        }),
        ('기능평가', {
            'fields': ('mobility', 'eating', 'excretion', 'fall_risk')
        }),
        ('의료정보', {
            'fields': ('diseases', 'current_medications', 'drug_allergies', 'pain_info'),
            'classes': ('collapse',)
        }),
        ('감염관리', {
            'fields': ('infection_history', 'isolation_required'),
            'classes': ('collapse',)
        }),
        ('교육정보', {
            'fields': ('understanding_level', 'education_needs'),
            'classes': ('collapse',)
        })
    )

# Django 관리자 사이트 커스터마이징
admin.site.site_header = "StrokeCare+ 환자 관리"
admin.site.site_title = "StrokeCare+ Admin"
admin.site.index_title = "환자 관리 시스템"