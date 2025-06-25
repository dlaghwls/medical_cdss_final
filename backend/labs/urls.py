from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LabTestTypeViewSet, LabOrderViewSet, LabResultViewSet

# 라우터 생성 및 ViewSet 등록
router = DefaultRouter()
router.register(r'test-types', LabTestTypeViewSet, basename='labtesttype')
router.register(r'orders', LabOrderViewSet, basename='laborder')
router.register(r'results', LabResultViewSet, basename='labresult')

# urlpatterns는 라우터의 URL들을 포함
urlpatterns = [
    path('', include(router.urls)),
]

# API 경로 예시:
# GET /labs/test-types/
# GET /labs/test-types/<uuid>/items/
# POST /labs/orders/
# POST /labs/results/