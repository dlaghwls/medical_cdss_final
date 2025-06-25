# backend/pacs/urls.py

from django.urls import path, include
from .views import (
    DicomUploadView,
    PatientStudiesView,
    VerifyPacsIdView,
    SeriesInstancesView,
    get_dicom_instance_data  # <-- 새로운 뷰 함수 import
)

urlpatterns = [
    # 기존 DICOM 업로드 API
    path('upload/', DicomUploadView.as_view(), name='dicom_upload'),
    
    # 환자 스터디 조회 API (메타데이터)
    path('patients/<str:patient_pacs_id>/studies/', PatientStudiesView.as_view(), name='patient_studies'),
    
    # PACS ID 검증 API
    path('verify-pacs-id/<str:pacs_id>/', VerifyPacsIdView.as_view(), name='verify_pacs_id'),
    
    # 특정 시리즈의 인스턴스 목록(imageIds)을 반환하는 API (Cornerstone.js용)
    # 이 API는 이제 아래의 'dicom_instance_data' 엔드포인트를 참조하는 ImageId를 반환할 것입니다.
    path('viewer-images/<str:study_instance_uid>/<str:series_instance_uid>/', 
         SeriesInstancesView.as_view(), name='series_instances'),
    
    # ★★★ 새롭게 추가된 DICOM 인스턴스 데이터 스트리밍 API ★★★
    # Cornerstone.js가 실제로 DICOM 파일의 바이너리 데이터를 가져올 엔드포인트입니다.
    # instance_id는 Orthanc 내부의 Instance UUID여야 합니다.
    path('dicom-instance-data/<str:instance_id>/', get_dicom_instance_data, name='dicom_instance_data'),
]
