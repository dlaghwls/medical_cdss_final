from django.contrib import admin
from .models import LabTestType, LabTestItem, LabOrder, LabResult

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
    list_display = ['__str__', 'collected_at', 'reported_at', 'performed_by', 'lab_location']
    list_filter = ['test_type', 'lab_location']
    search_fields = ['patient__display_name', 'performed_by']
    ordering = ['-collected_at']
    date_hierarchy = 'collected_at'

    # 필드 그룹 설정 (Form에서 보기 쉽게)
    fieldsets = (
        (None, {
            'fields': ('patient', 'test_type')
        }),
        ('일정 및 장소', {
            'fields': ('collected_at', 'reported_at', 'lab_location', 'performed_by')
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


