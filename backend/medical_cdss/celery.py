# backend/medical_cdss/celery.py
import os
from celery import Celery
from django.conf import settings

# Django 설정 모듈 지정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_cdss.settings')

# Celery 앱 생성
app = Celery('medical_cdss')

# Django 설정에서 Celery 설정 로드
app.config_from_object('django.conf:settings', namespace='CELERY')

# Django 앱에서 태스크 자동 발견
app.autodiscover_tasks()

# 기본 태스크 설정
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Seoul',
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=3600,  # 1시간 후 결과 삭제
)

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')