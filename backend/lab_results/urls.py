# backend/lab_results/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
# View들을 정확히 import 했는지 확인
from .views import LabResultViewSet, StrokeInfoHistoryView, ComplicationsHistoryView

router = DefaultRouter()
# basename은 URL 이름 충돌을 방지하는 좋은 습관입니다.
router.register(r'', LabResultViewSet, basename='labresult')

urlpatterns = [
    # ★★★ 순서가 중요합니다. 구체적인 URL을 먼저 등록합니다. ★★★
    path('stroke-info/', StrokeInfoHistoryView.as_view(), name='stroke-info-history'),
    path('complications-medications/', ComplicationsHistoryView.as_view(), name='complications-history'),
    
    # 이전에 있던 by-patient 경로는 ViewSet에 통합될 수 있으나, 일단 유지합니다.
    path('by-patient/', LabResultViewSet.as_view({'get': 'by_patient'}), name='lab_results_by_patient'),
    
    # DefaultRouter가 생성하는 URL은 가장 마지막에 두는 것이 안전합니다.
    path('', include(router.urls)),
]