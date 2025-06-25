from django.contrib import admin
from .models import ClinicalRule, CDSSAlert, DrugInteraction, DiagnosisSupport

@admin.register(ClinicalRule)
class ClinicalRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'rule_type', 'priority', 'is_active', 'created_at']
    list_filter = ['rule_type', 'priority', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    
    fieldsets = (
        ('기본정보', {
            'fields': ('name', 'description', 'rule_type', 'priority', 'is_active')
        }),
        ('규칙설정', {
            'fields': ('conditions', 'actions')
        }),
        ('적용대상', {
            'fields': ('departments', 'age_min', 'age_max')
        }),
        ('시스템정보', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']

@admin.register(CDSSAlert)
class CDSSAlertAdmin(admin.ModelAdmin):
    list_display = ['title', 'patient', 'rule', 'status', 'triggered_at', 'acknowledged_by']
    list_filter = ['status', 'rule__priority', 'triggered_at', 'acknowledged_by']
    search_fields = ['title', 'patient__name', 'rule__name', 'message']
    date_hierarchy = 'triggered_at'
    
    fieldsets = (
        ('기본정보', {
            'fields': ('patient', 'visit', 'rule', 'status')
        }),
        ('알림내용', {
            'fields': ('title', 'message', 'recommendation')
        }),
        ('처리정보', {
            'fields': ('acknowledged_by', 'acknowledged_at', 'resolved_at', 'notes')
        }),
    )
    readonly_fields = ['triggered_at']

@admin.register(DrugInteraction)
class DrugInteractionAdmin(admin.ModelAdmin):
    list_display = ['drug_a', 'drug_b', 'severity', 'is_active', 'created_at']
    list_filter = ['severity', 'is_active', 'created_at']
    search_fields = ['drug_a', 'drug_b', 'description']
    
    fieldsets = (
        ('약물정보', {
            'fields': ('drug_a', 'drug_b', 'severity', 'is_active')
        }),
        ('상호작용정보', {
            'fields': ('description', 'mechanism', 'clinical_effect', 'management')
        }),
    )

@admin.register(DiagnosisSupport)
class DiagnosisSupportAdmin(admin.ModelAdmin):
    list_display = ['patient', 'visit', 'analyzed_at', 'analyzed_by', 'ai_helpful']
    list_filter = ['analyzed_at', 'analyzed_by', 'ai_helpful']
    search_fields = ['patient__name', 'final_diagnosis', 'doctor_notes']
    date_hierarchy = 'analyzed_at'
    
    fieldsets = (
        ('기본정보', {
            'fields': ('patient', 'visit', 'analyzed_by')
        }),
        ('입력데이터', {
            'fields': ('symptoms', 'vital_signs', 'lab_results')
        }),
        ('AI분석결과', {
            'fields': ('suggested_diagnoses', 'confidence_scores', 'reasoning')
        }),
        ('의사판단', {
            'fields': ('final_diagnosis', 'doctor_notes', 'ai_helpful')
        }),
    )
    readonly_fields = ['analyzed_at']