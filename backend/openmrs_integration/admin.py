from django.contrib import admin
from .models import OpenMRSPatient

@admin.register(OpenMRSPatient)
class OpenMRSPatientAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'identifier', 'given_name', 'family_name', 'gender', 'birthdate', 'uuid']
    list_filter = ['gender', 'birthdate']
    search_fields = ['display_name', 'identifier', 'given_name', 'family_name', 'uuid']
    readonly_fields = ['uuid', 'raw_openmrs_data']
    
    fieldsets = (
        ('기본정보', {
            'fields': ('display_name', 'identifier', 'given_name', 'family_name', 'gender', 'birthdate')
        }),
        ('시스템정보', {
            'fields': ('uuid',),
            'classes': ('collapse',)
        }),
        ('OpenMRS 원본 데이터', {
            'fields': ('raw_openmrs_data',),
            'classes': ('collapse',)
        }),
    )
    
    # 읽기 전용으로 설정 (OpenMRS에서 관리되므로)
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False