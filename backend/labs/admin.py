from django.contrib import admin
from .models import LabTestType, LabTestItem, LabOrder, LabResult, STATUS_CHOICES # STATUS_CHOICES도 임포트할 수 있음 (선택 사항)

# LabTestType
@admin.register(LabTestType)
class LabTestTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']
    ordering = ['name']
    list_filter = ['created_at']


# LabTestItem
@admin.register(LabTestItem)
class LabTestItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'test_type', 'unit', 'ref_low', 'ref_high', 'gender_ref', 'sort_order']
    list_filter = ['test_type']
    search_fields = ['name', 'test_type__name']
    ordering = ['test_type', 'sort_order']


# LabOrder
@admin.register(LabOrder)
class LabOrderAdmin(admin.ModelAdmin):
    # 'status' 필드를 list_display에 추가합니다.
    # 'created_at' 필드도 추가되었다면 여기에 포함할 수 있습니다.
    list_display = ['__str__', 'status', 'collected_at', 'reported_at', 'performed_by', 'lab_location', 'created_at']
    
    # 'status' 필드를 list_filter에 추가합니다.
    list_filter = ['test_type', 'lab_location', 'status'] 
    
    search_fields = ['patient__display_name', 'performed_by']
    
    # 정렬 기준을 created_at으로 변경했다면, 여기에 반영하는 것이 좋습니다.
    # 하지만 __str__에서 collected_at.date()를 사용하므로 ordering은 그대로 두겠습니다.
    ordering = ['-collected_at'] 
    
    date_hierarchy = 'collected_at' # 또는 'created_at' (선택 사항)

    # 필드 그룹 설정 (Form에서 보기 쉽게)
    fieldsets = (
        (None, {
            'fields': ('patient', 'test_type', 'status') # 'status' 필드를 여기에 추가합니다.
        }),
        ('일정 및 장소', {
            'fields': ('collected_at', 'reported_at', 'lab_location', 'performed_by', 'created_at') # 'created_at' 필드도 추가
        }),
    )


# LabResult
@admin.register(LabResult)
class LabResultAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'result_value', 'note']
    list_filter = ['test_item']
    search_fields = ['lab_order__patient__display_name', 'test_item__name']
    ordering = ['lab_order', 'test_item']
    autocomplete_fields = ['lab_order', 'test_item']


