# backend/ml_models/urls.py - 수정된 API 엔드포인트
from django.urls import path
from . import views

urlpatterns = [
    # ============= 예측 API =============
    # 합병증 예측
    path('predict/complications/', views.predict_complications, name='predict_complications'),
    path('predict_complications/', views.predict_complications, name='predict_complications_legacy'),  # 기존 호환성
    
    # 사망률 예측
    path('predict/mortality/', views.predict_mortality, name='predict_mortality'),
    path('predict_mortality/', views.predict_mortality, name='predict_mortality_legacy'),  # 기존 호환성
    path('predict/stroke-mortality/', views.predict_stroke_mortality, name='predict_stroke_mortality'),  # 기존 호환성
    
    # ============= 데이터 등록 API =============
    # 합병증 데이터 등록
    path('register/complications/', views.register_complications_data, name='register_complications_data'),
    path('register-complications-data/', views.register_complications_data, name='register_complications_data_legacy'),
    
    # 사망률 데이터 등록
    path('register/mortality/', views.register_mortality_data, name='register_mortality_data'),
    path('register-mortality-data/', views.register_mortality_data, name='register_mortality_data_legacy'),
    
    # ============= 이력 조회 API =============
    # 합병증 이력
    path('history/complications/<str:patient_uuid>/', views.get_complications_history, name='get_complications_history'),
    path('complications-history/', views.get_complications_history, name='complications_history_legacy'),  # 쿼리 파라미터 방식
    
    # 사망률 이력
    path('history/mortality/<str:patient_uuid>/', views.get_mortality_history, name='get_mortality_history'),
    path('mortality-history/', views.get_mortality_history, name='mortality_history_legacy'),  # 쿼리 파라미터 방식
    
    # ============= 환자별 통합 API (기존 유지) =============
    path('patient/<str:patient_uuid>/info/', views.get_patient_info, name='patient_info'),
    path('patient/<str:patient_uuid>/predictions/', views.save_predictions_data, name='save_predictions'),
    path('patient/<str:patient_uuid>/results/', views.get_prediction_results, name='get_prediction_results'),
    
    # ============= SOD2 관련 API (기존 유지) =============
    path('patient/<str:patient_uuid>/sod2/', views.sod2_analysis, name='sod2_analysis'),
    path('sod2/assess/', views.assess_sod2_status, name='assess_sod2_status'),
    path('patient/<str:patient_uuid>/sod2/assessments/', views.get_sod2_assessments, name='get_sod2_assessments'),
    path('patient/<str:patient_uuid>/sod2/latest/', views.get_latest_sod2_assessment, name='get_latest_sod2_assessment'),
    
    # ============= 기타 API =============
    path('patient/<str:patient_uuid>/complications/', views.save_complications_medications, name='save_complications'),
    path('patient/<str:patient_uuid>/lab-results/', views.lis_lab_results, name='lis_lab_results'),
    
    # Gene model (기존 유지)
    path('gene/upload/', views.GeneCSVUploadView.as_view(), name='gene_csv_upload'),
]