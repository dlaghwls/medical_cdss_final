# backend/ml_models/tasks.py - 단순화 버전
from dotenv import load_dotenv
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent
load_dotenv(dotenv_path=ROOT_DIR / '.env') 


from celery import shared_task
from django.utils import timezone
from .ml_service import ml_service
from .sod2_service import sod2_service
from .models import PredictionTask
from patients.models import Patient, Visit
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def predict_complications_task(self, patient_id, visit_id, patient_data):
    """합병증 예측 비동기 태스크"""
    task_id = self.request.id
    prediction_task = None
    
    try:
        # 환자와 방문 정보 가져오기
        patient = Patient.objects.get(id=patient_id)
        visit = Visit.objects.get(id=visit_id) if visit_id else None
        
        # 예측 작업 기록 생성
        prediction_task = PredictionTask.objects.create(
            task_id=task_id,
            patient=patient,
            visit=visit,
            task_type='COMPLICATION',
            status='PROCESSING',
            input_data=patient_data
        )
        
        # ML 서비스로 예측 실행
        start_time = timezone.now()
        results = ml_service.predict_complications(patient_data)
        processing_time = (timezone.now() - start_time).total_seconds()
        
        if 'error' in results:
            prediction_task.status = 'FAILED'
            prediction_task.error_message = results['error']
            prediction_task.save()
            return {'error': results['error']}
        
        # 결과 저장
        prediction_task.predictions = results
        prediction_task.processing_time = processing_time
        prediction_task.status = 'COMPLETED'
        prediction_task.completed_at = timezone.now()
        prediction_task.save()
        
        logger.info(f"합병증 예측 완료: Task {task_id}, Patient {patient.name}")
        return {
            'task_id': task_id,
            'status': 'completed',
            'results': results,
            'processing_time': processing_time
        }
        
    except Exception as e:
        logger.error(f"합병증 예측 실패: {str(e)}")
        if prediction_task:
            prediction_task.status = 'FAILED'
            prediction_task.error_message = str(e)
            prediction_task.save()
        return {'error': str(e)}

@shared_task(bind=True)
def predict_stroke_mortality_task(self, patient_id, visit_id, patient_data):
    """뇌졸중 사망률 예측 비동기 태스크"""
    task_id = self.request.id
    prediction_task = None
    
    try:
        patient = Patient.objects.get(id=patient_id)
        visit = Visit.objects.get(id=visit_id) if visit_id else None
        
        prediction_task = PredictionTask.objects.create(
            task_id=task_id,
            patient=patient,
            visit=visit,
            task_type='MORTALITY',
            status='PROCESSING',
            input_data=patient_data
        )
        
        start_time = timezone.now()
        result = ml_service.predict_stroke_mortality(patient_data)
        processing_time = (timezone.now() - start_time).total_seconds()
        
        if 'error' in result:
            prediction_task.status = 'FAILED'
            prediction_task.error_message = result['error']
            prediction_task.save()
            return {'error': result['error']}
        
        prediction_task.predictions = result
        prediction_task.processing_time = processing_time
        prediction_task.status = 'COMPLETED'
        prediction_task.completed_at = timezone.now()
        prediction_task.save()
        
        logger.info(f"사망률 예측 완료: Task {task_id}, Patient {patient.name}")
        return {
            'task_id': task_id,
            'status': 'completed',
            'result': result,
            'processing_time': processing_time
        }
        
    except Exception as e:
        logger.error(f"사망률 예측 실패: {str(e)}")
        if prediction_task:
            prediction_task.status = 'FAILED'
            prediction_task.error_message = str(e)
            prediction_task.save()
        return {'error': str(e)}

@shared_task(bind=True)
def assess_sod2_status_task(self, patient_id, visit_id, patient_data):
    """SOD2 항산화 평가 비동기 태스크"""
    task_id = self.request.id
    prediction_task = None
    
    try:
        patient = Patient.objects.get(id=patient_id)
        visit = Visit.objects.get(id=visit_id) if visit_id else None
        
        prediction_task = PredictionTask.objects.create(
            task_id=task_id,
            patient=patient,
            visit=visit,
            task_type='SOD2_ASSESSMENT',
            status='PROCESSING',
            input_data=patient_data
        )
        
        start_time = timezone.now()
        result = sod2_service.assess_sod2_status(patient_data)
        processing_time = (timezone.now() - start_time).total_seconds()
        
        if 'error' in result:
            prediction_task.status = 'FAILED'
            prediction_task.error_message = result['error']
            prediction_task.save()
            return {'error': result['error']}
        
        prediction_task.predictions = result
        prediction_task.processing_time = processing_time
        prediction_task.status = 'COMPLETED'
        prediction_task.completed_at = timezone.now()
        prediction_task.save()
        
        logger.info(f"SOD2 평가 완료: Task {task_id}, Patient {patient.name}")
        return {
            'task_id': task_id,
            'status': 'completed',
            'result': result,
            'processing_time': processing_time
        }
        
    except Exception as e:
        logger.error(f"SOD2 평가 실패: {str(e)}")
        if prediction_task:
            prediction_task.status = 'FAILED'
            prediction_task.error_message = str(e)
            prediction_task.save()
        return {'error': str(e)}

@shared_task
def cleanup_old_tasks():
    """오래된 예측 작업 정리 (30일 이전)"""
    from datetime import timedelta
    cutoff_date = timezone.now() - timedelta(days=30)
    
    deleted_count = PredictionTask.objects.filter(
        created_at__lt=cutoff_date,
        status__in=['COMPLETED', 'FAILED']
    ).delete()[0]
    
    logger.info(f"정리된 오래된 작업 수: {deleted_count}")
    return deleted_count

# gene_model
import io
import requests
import logging
from django.conf import settings
from .models import geneAIResult
from celery import shared_task

logger = logging.getLogger(__name__)

@shared_task(bind=True, queue="gene_inference")
def run_gene_inference_task(self, file_content, identifier):
    logger.info(f"[Task Start] run_gene_inference_task 시작 - identifier: {identifier}")
    try:
        FASTAPI_URL = getattr(settings, "GENE_INFERENCE_API", "http://gene_inference:8002/predict_csv")
        logger.info(f"[Step 1] FastAPI URL 설정: {FASTAPI_URL}")

        files = {'file': ('input.csv', io.BytesIO(file_content))}
        data = {'identifier': identifier}
        logger.info(f"[Step 2] FastAPI POST 요청 준비 완료 - identifier: {identifier}")

        response = requests.post(FASTAPI_URL, files=files, data=data, timeout=60)
        response.raise_for_status()
        logger.info(f"[Step 3] FastAPI 응답 수신 성공 - 상태코드: {response.status_code}")

        result_json = response.json()
        logger.debug(f"[Step 4] FastAPI 응답 JSON: {result_json}")

        confidence_score = result_json.get("result", None)
        model_name = result_json.get("model_name", "")
        model_version = result_json.get("model_version", "")
        result_text = result_json.get("result_text", "")
        logger.info(f"[Step 5] 추론 결과 파싱 완료 - confidence_score: {confidence_score}")

        geneAIResult.objects.create(
            identifier=identifier,
            confidence_score=confidence_score,
            model_name=model_name,
            model_version=model_version,
            result_text=result_text,
        )
        logger.info(f"[Step 6] geneAIResult DB 저장 성공 - identifier: {identifier}")
        return True

    except requests.exceptions.Timeout:
        logger.error(f"[Error] FastAPI 요청 타임아웃 발생 - identifier: {identifier}", exc_info=True)
        return False
    except requests.exceptions.ConnectionError:
        logger.error(f"[Error] FastAPI 연결 실패 - identifier: {identifier}", exc_info=True)
        return False
    except requests.exceptions.HTTPError as http_err:
        logger.error(f"[Error] HTTP 오류 발생: {http_err} - identifier: {identifier}", exc_info=True)
        return False
    except requests.exceptions.RequestException as req_err:
        logger.error(f"[Error] 알 수 없는 요청 오류: {req_err} - identifier: {identifier}", exc_info=True)
        return False
    except Exception as e:
        logger.error(f"[Error] 태스크 처리 실패: {e} - identifier: {identifier}", exc_info=True)
        return False
