# backend/ml_models/admin.py
from django.contrib import admin
from .models import (
    PredictionTask, 
    ComplicationPrediction, 
    StrokeMortalityPrediction, 
    SOD2Assessment,
    geneAIResult
)

@admin.register(PredictionTask)
class PredictionTaskAdmin(admin.ModelAdmin):
    list_display = ['task_id_short', 'patient_display', 'task_type', 'status', 'created_at', 'processing_time', 'requested_by_display']
    list_filter = ['task_type', 'status', 'created_at']
    search_fields = ['task_id', 'patient__display_name']
    readonly_fields = ['task_id', 'created_at', 'completed_at', 'processing_time']
    
    def task_id_short(self, obj):
        return str(obj.task_id)[:8] + "..." if obj.task_id else "N/A"
    task_id_short.short_description = "작업 ID"
    
    def patient_display(self, obj):
        return obj.patient.display_name if obj.patient else "N/A"
    patient_display.short_description = "환자명"
    patient_display.admin_order_field = 'patient__display_name'
    
    def requested_by_display(self, obj):
        return obj.requested_by.display_name if obj.requested_by else "시스템"
    requested_by_display.short_description = "요청자"
    requested_by_display.admin_order_field = 'requested_by__display_name'
    
    fieldsets = (
        ('기본정보', {
            'fields': ('task_id', 'patient', 'task_type', 'status', 'requested_by')
        }),
        ('데이터', {
            'fields': ('input_data', 'predictions', 'error_message'),
            'classes': ('collapse',)
        }),
        ('시간정보', {
            'fields': ('created_at', 'completed_at', 'processing_time'),
            'classes': ('collapse',)
        }),
    )

@admin.register(ComplicationPrediction)
class ComplicationPredictionAdmin(admin.ModelAdmin):
    list_display = ['task_patient_name', 'complication_type', 'probability_percent', 'risk_level', 'model_type']
    list_filter = ['complication_type', 'risk_level', 'model_type', 'model_strategy']
    search_fields = ['task__patient__display_name', 'complication_type']
    
    def task_patient_name(self, obj):
        return obj.task.patient.display_name if obj.task and obj.task.patient else "N/A"
    task_patient_name.short_description = "환자명"
    task_patient_name.admin_order_field = 'task__patient__display_name'
    
    def probability_percent(self, obj):
        return f"{obj.probability:.1%}" if obj.probability else "N/A"
    probability_percent.short_description = "발생 확률"
    probability_percent.admin_order_field = 'probability'
    
    fieldsets = (
        ('기본정보', {
            'fields': ('task', 'complication_type', 'probability', 'risk_level', 'threshold')
        }),
        ('모델 성능', {
            'fields': ('model_auc', 'model_precision', 'model_recall', 'model_f1'),
            'classes': ('collapse',)
        }),
        ('모델 정보', {
            'fields': ('model_type', 'model_strategy', 'important_features'),
            'classes': ('collapse',)
        })
    )

@admin.register(StrokeMortalityPrediction)
class StrokeMortalityPredictionAdmin(admin.ModelAdmin):
    list_display = ['task_patient_name', 'mortality_30_day_percent', 'mortality_30_day_risk_level', 
                   'stroke_type', 'nihss_score', 'monitoring_priority']
    list_filter = ['mortality_30_day_risk_level', 'stroke_type', 'reperfusion_treatment', 'monitoring_priority']
    search_fields = ['task__patient__display_name', 'stroke_type']
    
    def task_patient_name(self, obj):
        return obj.task.patient.display_name if obj.task and obj.task.patient else "N/A"
    task_patient_name.short_description = "환자명"
    task_patient_name.admin_order_field = 'task__patient__display_name'
    
    def mortality_30_day_percent(self, obj):
        return f"{obj.mortality_30_day:.1%}" if obj.mortality_30_day else "N/A"
    mortality_30_day_percent.short_description = "30일 사망률"
    mortality_30_day_percent.admin_order_field = 'mortality_30_day'
    
    fieldsets = (
        ('기본정보', {
            'fields': ('task',)
        }),
        ('사망률 예측', {
            'fields': ('mortality_30_day', 'mortality_30_day_risk_level', 'mortality_in_hospital', 
                      'mortality_90_day', 'mortality_1_year')
        }),
        ('환자 정보', {
            'fields': ('stroke_type', 'nihss_score', 'reperfusion_treatment', 'reperfusion_time'),
        }),
        ('위험 요인', {
            'fields': ('risk_factors', 'protective_factors'),
            'classes': ('collapse',)
        }),
        ('모델 정보', {
            'fields': ('model_confidence', 'model_auc'),
            'classes': ('collapse',)
        }),
        ('임상 정보', {
            'fields': ('clinical_recommendations', 'monitoring_priority'),
            'classes': ('collapse',)
        })
    )

@admin.register(SOD2Assessment)
class SOD2AssessmentAdmin(admin.ModelAdmin):
    list_display = ['task_display', 'current_sod2_level', 'oxidative_stress_risk', 
                   'exercise_can_start', 'exercise_intensity', 'prediction_confidence']
    list_filter = ['oxidative_stress_risk', 'exercise_can_start', 'stroke_type', 
                   'reperfusion_treatment']
    search_fields = ['task__patient__display_name']
    
    def task_display(self, obj):
        return f"{obj.task.patient.display_name}" if obj.task and obj.task.patient else "N/A"
    task_display.short_description = "환자명"
    task_display.admin_order_field = 'task__patient__display_name'
    
    fieldsets = (
        ('기본정보', {
            'fields': ('task',)
        }),
        ('환자정보', {
            'fields': ('age', 'gender'),
        }),
        ('뇌졸중정보', {
            'fields': ('stroke_type', 'stroke_date', 'nihss_score', 
                      'reperfusion_treatment', 'reperfusion_time', 'hours_after_stroke'),
            'classes': ('collapse',)
        }),
        ('SOD2 평가결과', {
            'fields': ('current_sod2_level', 'sod2_target_level', 'oxidative_stress_risk', 
                      'prediction_confidence'),
        }),
        ('운동처방', {
            'fields': ('exercise_can_start', 'exercise_intensity', 'exercise_start_time', 
                      'exercise_recommendations'),
        }),
        ('보정인수', {
            'fields': ('age_adjustment_factor', 'stroke_type_adjustment', 
                      'nihss_adjustment', 'reperfusion_timing_adjustment'),
            'classes': ('collapse',)
        }),
        ('기타정보', {
            'fields': ('clinical_recommendations', 'monitoring_schedule'),
            'classes': ('collapse',)
        }),
        ('기술정보', {
            'fields': ('sod2_prediction_data',),
            'classes': ('collapse',)
        })
    )

@admin.register(geneAIResult)
class GeneAIResultAdmin(admin.ModelAdmin):
    list_display = ["id", "patient_display_name", "model_name", "confidence_score", "created_at"]
    search_fields = ["patient__display_name", "identifier", "model_name", "result_text"]
    list_filter = ["model_name", "created_at"]
    readonly_fields = ["created_at"]
    ordering = ["-created_at"]
    list_per_page = 50

    def patient_display_name(self, obj):
        return obj.patient.display_name if obj.patient else "N/A"
    patient_display_name.short_description = "환자명"
    patient_display_name.admin_order_field = 'patient__display_name'
    
    fieldsets = (
        ('기본정보', {
            'fields': ('patient', 'identifier')
        }),
        ('AI 모델정보', {
            'fields': ('model_name', 'model_version', 'confidence_score'),
        }),
        ('결과', {
            'fields': ('result_text',),
        }),
        ('시간정보', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )

# Django 관리자 사이트 커스터마이징
admin.site.site_header = "StrokeCare+ ML 모델 관리"
admin.site.site_title = "StrokeCare+ Admin"
admin.site.index_title = "머신러닝 모델 관리 시스템"