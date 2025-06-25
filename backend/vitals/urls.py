from rest_framework.routers import DefaultRouter
from .views import VitalSessionViewSet

router = DefaultRouter()

# 메인 urls.py에서 이미 'vitals' 경로를 지정했으므로, 여기서는 빈 문자열('')로 등록합니다.
# 이렇게 해야 경로가 중복되지 않습니다.
router.register(r'', VitalSessionViewSet, basename='vitals')

urlpatterns = router.urls