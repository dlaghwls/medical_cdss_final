from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DoctorViewSet, NurseInitialAssessmentViewSet
# OpenMRS 통합 뷰를 임포트
from openmrs_integration.views import get_django_patient_list_only, create_patient_in_openmrs_and_django, get_openmrs_patient_detail

router = DefaultRouter()
# PatientViewSet 제거 - OpenMRS 통합 뷰로 대체
router.register(r'doctors', DoctorViewSet)
router.register(r'nurse-assessments', NurseInitialAssessmentViewSet)

urlpatterns = [
    # OpenMRS 통합 환자 API - Router보다 먼저 배치
    path('patients/', get_django_patient_list_only, name='patient-list'),
    path('patients/create/', create_patient_in_openmrs_and_django, name='patient-create'),
    path('patients/<uuid:patient_uuid>/', get_openmrs_patient_detail, name='patient-detail'),
    
    # Router는 마지막에 배치
    path('', include(router.urls)),

    # 6월 16일 Flutter 관련
    # path('patients/<int:patient_id>/prediction/', prediction_result_view),
    # path('patients/<int:patient_id>/segmentation/', segmentation_result_view),
    # path('patients/<int:patient_id>/comments/', comment_view),
]
