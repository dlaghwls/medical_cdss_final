from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import VitalSession, VitalMeasurement

# VitalMeasurement 모델을 VitalSession 페이지에 '인라인' 형태로 추가하기 위한 클래스
class VitalMeasurementInline(admin.StackedInline):
    model = VitalMeasurement
    # OneToOne 관계이므로 추가/삭제는 세션에 종속됩니다.
    can_delete = False 
    verbose_name_plural = "측정된 바이탈 수치"
    # 상세 페이지에서 필드 순서를 지정하고 싶을 때 사용
    # fields = ('bp', 'hr', 'rr', 'temp', 'spo2')

# VitalSession 모델을 관리자 페이지에 등록하고 커스터마이징하는 클래스
@admin.register(VitalSession)
class VitalSessionAdmin(admin.ModelAdmin):
    # 위에서 정의한 VitalMeasurementInline을 여기에 포함시킵니다.
    inlines = (VitalMeasurementInline,)
    
    # 목록 페이지에 보여줄 필드들을 지정합니다.
    list_display = (
        'session_id', 
        'patient_link', 
        'display_measurements_summary', # 측정값 요약 표시
        'recorded_at',
    )

    # 목록 페이지에서 필터링할 수 있는 옵션을 제공합니다.
    list_filter = ('recorded_at',)

    # 검색 기능을 추가하고, 어떤 필드를 기준으로 검색할지 지정합니다.
    search_fields = (
        'session_id__iexact',             # 세션 ID로 정확히 검색 (대소문자 무시)
        'patient__display_name__icontains', # 환자 이름으로 포함 검색
    )

    # 상세 페이지(수정/추가 페이지)의 필드 순서와 모양을 제어합니다.
    # VitalMeasurement 필드들은 'inlines'에 의해 자동으로 표시됩니다.
    fields = ('patient', 'recorded_at', 'notes')

    # 환자 이름을 클릭하면 해당 환자의 관리자 페이지로 이동하는 링크를 만듭니다.
    def patient_link(self, obj):
        # OpenMRSPatient 모델의 앱 이름은 'openmrs_integration' 입니다.
        app_label = obj.patient._meta.app_label
        model_name = obj.patient._meta.model_name
        url = reverse(f"admin:{app_label}_{model_name}_change", args=[obj.patient.pk])
        return format_html('<a href="{}">{}</a>', url, obj.patient.display_name)
    
    patient_link.short_description = "환자" # 컬럼 제목
    patient_link.admin_order_field = 'patient__display_name' # 이름으로 정렬


    # 관련된 VitalMeasurement 객체의 값들을 요약해서 보여주는 함수
    def display_measurements_summary(self, obj):
        try:
            # obj.measurements를 통해 OneToOne 관계의 VitalMeasurement 객체에 접근
            m = obj.measurements
            summary = f"BP: {m.bp}, HR: {m.hr}, RR: {m.rr}, Temp: {m.temp}, SpO2: {m.spo2}"
            return summary
        except VitalMeasurement.DoesNotExist:
            return "측정값 없음"

    display_measurements_summary.short_description = "바이탈 측정값 요약"