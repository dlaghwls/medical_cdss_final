# openmrs_integration/urls.py
from django.urls import path
from . import views

app_name = 'openmrs_integration'

urlpatterns = [
    # Django DB만 조회하는 환자 목록 API
    path('patients/local-list/', views.get_django_patient_list_only, name='django_patient_list_only'), 
    
    # OpenMRS와 동기화 후 Django DB 목록을 반환하는 API
    path('patients/sync-and-list/', views.get_patients_and_sync_from_openmrs, name='sync_then_list_patients'),
    
    # OpenMRS에 새 환자 생성 및 Django DB에 저장하는 API
    path('patients/create/', views.create_patient_in_openmrs_and_django, name='create_patient_in_omrs_and_django'), # 이름 변경
    
    # 단일 환자 상세 조회 (OpenMRS에서 가져와 Django DB에 저장/업데이트)
    path('patients/<str:patient_uuid>/', views.get_openmrs_patient_detail, name='omrs_patient_detail'),
]