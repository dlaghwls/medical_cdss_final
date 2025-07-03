from django.contrib import admin
from django.urls import path, include
from openmrs_integration.views import get_django_patient_list_only
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import MyTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/pacs/', include('pacs.urls')), # 유정우넌할수있어
    
    # API v1 paths
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("api/ml_models/", include('ml_models.urls')), 
    path("api/ml/", include('ml_models.urls')), 
    path("api/omrs/", include('openmrs_integration.urls')),
    path("api/analyze/", include("analyze.urls")),
    path('api/lab-results/', include('lab_results.urls')),
    path('api/chat/', include('chat.urls')), 
    path('api/auth/', include('accounts.urls')),
    path('api/patients/', get_django_patient_list_only, name='patient-list-direct'),
    path('api/patients/', include('patients.urls')),
    path('api/vitals/', include('vitals.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/labs/', include('labs.urls')), 
    
]
# 6월 16일 Fluter 관련
# urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
