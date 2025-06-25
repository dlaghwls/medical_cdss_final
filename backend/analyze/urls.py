from django.urls import path
from . import views

urlpatterns = [
    path('predict/', views.run_prediction, name='run_prediction'),
    path('segment/', views.run_segmentation, name='run_segmentation'),
]