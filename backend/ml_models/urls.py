# backend/ml_models/urls.py - UX에 맞춘 URL 패턴
from django.urls import path
from . import views
from .views import GeneCSVUploadView  # <- 필요하다면 이 방식으로!


urlpatterns = [
    # 환자별 상세 페이지 API들
    path('patient/<str:patient_uuid>/info/', views.get_patient_info, name='patient_info'),
    path('patient/<str:patient_uuid>/predictions/', views.save_predictions_data, name='save_predictions'),
    path('patient/<str:patient_uuid>/sod2/', views.sod2_analysis, name='sod2_analysis'),
    path('patient/<str:patient_uuid>/complications/', views.save_complications_medications, name='save_complications'),
    path('patient/<str:patient_uuid>/lab-results/', views.lis_lab_results, name='lis_lab_results'),
    path('patient/<str:patient_uuid>/results/', views.get_prediction_results, name='get_prediction_results'),
    
    # SOD2 관련 추가 (새로 추가된 부분)
    path('sod2/assess/', views.assess_sod2_status, name='assess_sod2_status'),
    path('patient/<str:patient_uuid>/sod2/assessments/', views.get_sod2_assessments, name='get_sod2_assessments'),
    path('patient/<str:patient_uuid>/sod2/latest/', views.get_latest_sod2_assessment, name='get_latest_sod2_assessment'),
    
    # 기존 API 호환성 유지
    path('predict/complications/', views.predict_complications, name='predict_complications'),
    path('predict/mortality/', views.predict_stroke_mortality, name='predict_stroke_mortality'),

    # gene model
    path('gene/upload/', GeneCSVUploadView.as_view(), name='gene_csv_upload'),
    
    # 사망률
    path('predict_mortality/', views.predict_mortality, name='predict_mortality'),
]