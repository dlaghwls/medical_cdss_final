from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from io import StringIO
# from django.http import JsonResponse # 필요하지 않을 수 있으므로 주석 처리

# 2025/06/12 / 16:22 반영
from patients.models import Patient # 만약 Patient 모델이 필요하다면 유지
from openmrs_integration.models import OpenMRSPatient
from lab_results.models import LabResult
from .models import ComplicationPrediction, SOD2Assessment as SOD2Analysis, PredictionTask, StrokeMortalityPrediction

import logging
import json
import pandas as pd
import uuid
from datetime import datetime
from .ml_service import ml_service
from .sod2_service import sod2_service

# 사망률 예측을 위한 추가 import
import numpy as np
from .utils import load_ml_model, validate_model_features

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_patient_info(request, patient_uuid):
    """환자 기본 정보 조회"""
    try:
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        patient_data = {
            'uuid': str(patient.uuid),
            'name': patient.display_name,
            'identifier': patient.identifier,
            'given_name': patient.given_name,
            'family_name': patient.family_name,
            'gender': patient.gender,
            'birthdate': patient.birthdate,
            'created_at': patient.created_at,
        }
        
        return Response(patient_data)
        
    except Exception as e:
        logger.error(f"환자 정보 조회 실패: {e}")
        return Response(
            {'error': '환자 정보를 조회할 수 없습니다.'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def save_predictions_data(request, patient_uuid):
    """새 예측 데이터 저장 (예측 결과와 입력 데이터를 받아서 저장)"""
    try:
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        data = request.data # 예측 결과와 입력 데이터가 포함된 request.data
        
        prediction_type = data.get('prediction_type', 'unknown') # 예측 유형
        prediction_input = data.get('input_data', {}) # 예측에 사용된 입력 데이터
        prediction_results = data.get('results', {}) # 실제 예측 결과
        
        # created_by_user = request.user if request.user.is_authenticated else None # ⭐ created_by 제거

        prediction_task = PredictionTask.objects.create(
            task_id=uuid.uuid4(),
            patient=patient, 
            task_type=prediction_type,
            status='COMPLETED',
            input_data=prediction_input,
            predictions=prediction_results,
            # created_by=created_by_user # ⭐ created_by 인자 제거
        )
        
        logger.info(f"예측 데이터 저장 완료 - 환자: {patient.display_name}, 예측 유형: {prediction_type}, Task ID: {prediction_task.task_id}")

        return Response({
            'message': '예측 데이터가 성공적으로 저장되었습니다.',
            'predictions': prediction_results,
            'task_id': prediction_task.task_id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"예측 데이터 저장 실패: {e}", exc_info=True)
        return Response(
            {'error': f'데이터 저장 중 오류가 발생했습니다: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ====== SOD2 관련 API (기존 유지) ======

@api_view(['POST'])
@permission_classes([AllowAny])
def assess_sod2_status(request):
    """SOD2 항산화 상태 평가 - 환자 정보 확실히 처리"""
    try:
        data = request.data
        patient_uuid = data.get('patient')
        
        if not patient_uuid:
            return Response(
                {'error': '환자 UUID가 필요합니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 환자 정보 조회
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        # ===== 프론트엔드에서 보낸 실제 나이/성별 사용 =====
        # 프론트엔드에서 이미 환자 정보를 추출해서 보내므로 그것을 신뢰
        final_age = data.get('age', 65)
        final_gender = data.get('gender', 'M')
        
        logger.info(f"SOD2 평가 - 환자 {patient_uuid}, 나이: {final_age}, 성별: {final_gender}")
        
        # 평가 데이터 구성 (실제 나이/성별 포함)
        assessment_data = {
            'age': final_age,
            'gender': final_gender,
            'stroke_info': data.get('stroke_info', {}),
            'patient': patient_uuid
        }
        
        # SOD2Service를 통한 평가 수행
        assessment_result = sod2_service.assess_sod2_status(assessment_data)
        
        if 'error' in assessment_result:
            return Response(
                {'error': assessment_result['error']}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # 평가 결과를 데이터베이스에 저장
        prediction_task = PredictionTask.objects.create(
            task_id=uuid.uuid4(),
            patient=patient,
            task_type='SOD2_ASSESSMENT',
            status='COMPLETED',
            input_data=data,
            predictions=assessment_result,
        )
        
        # stroke_date 안전 처리
        stroke_date_str = data.get('stroke_info', {}).get('stroke_date') or data.get('stroke_date')
        stroke_date = None
        if stroke_date_str:
            try:
                if isinstance(stroke_date_str, str):
                    stroke_date = datetime.strptime(stroke_date_str, '%Y-%m-%d').date()
                else:
                    stroke_date = stroke_date_str
            except ValueError:
                logger.warning(f"날짜 형식 오류: {stroke_date_str}")
        
        # reperfusion_time 안전 처리
        reperfusion_time = assessment_result['patient_info'].get('reperfusion_time')
        if reperfusion_time is not None:
            try:
                reperfusion_time = float(reperfusion_time)
            except (ValueError, TypeError):
                reperfusion_time = None
        
        # ===== SOD2 수준에 따른 동적 모니터링 일정 =====
        current_sod2_level = assessment_result['sod2_status']['current_level']
        risk_level = assessment_result['sod2_status']['oxidative_stress_risk']
        
        if current_sod2_level >= 0.9:  # 90% 이상
            monitoring_text = "주간 SOD2 수준 확인"
        elif current_sod2_level >= 0.85:  # 85-89%
            monitoring_text = "격일 SOD2 수준 확인"
        elif current_sod2_level >= 0.7:  # 70-84%
            monitoring_text = "48시간 후 재평가"
        elif current_sod2_level >= 0.5:  # 50-69%
            monitoring_text = "24시간 후 재평가"
        else:  # 50% 미만
            monitoring_text = "12시간 후 재평가"
        
        sod2_assessment = SOD2Analysis.objects.create(
            task=prediction_task,
            age=final_age,  # 실제 나이 저장
            gender=final_gender,  # 실제 성별 저장
            stroke_type=assessment_result['patient_info']['stroke_type'],
            stroke_date=stroke_date,
            nihss_score=assessment_result['patient_info']['nihss_score'],
            reperfusion_treatment=assessment_result['patient_info']['reperfusion_treatment'],
            reperfusion_time=reperfusion_time,
            hours_after_stroke=assessment_result['patient_info']['hours_after_stroke'],
            current_sod2_level=assessment_result['sod2_status']['current_level'],
            sod2_prediction_data=assessment_result['sod2_prediction_data'],
            oxidative_stress_risk=assessment_result['sod2_status']['oxidative_stress_risk'],
            prediction_confidence=assessment_result['sod2_status']['prediction_confidence'],
            exercise_can_start=assessment_result['exercise_recommendations']['can_start'],
            exercise_intensity=assessment_result['exercise_recommendations']['intensity'],
            exercise_start_time=assessment_result['exercise_recommendations'].get('start_time'),
            sod2_target_level=assessment_result['exercise_recommendations'].get('recommended_sod2_level', 0.85),
            age_adjustment_factor=assessment_result['personalization_factors']['age_adjustment'],
            stroke_type_adjustment=assessment_result['personalization_factors']['stroke_type_adjustment'],
            nihss_adjustment=assessment_result['personalization_factors']['nihss_adjustment'],
            reperfusion_timing_adjustment=assessment_result['personalization_factors']['reperfusion_timing_adjustment'],
            clinical_recommendations='\n'.join(assessment_result['clinical_recommendations']),
            exercise_recommendations=assessment_result['exercise_recommendations'],
            monitoring_schedule={'text': monitoring_text}  # 단순한 구조로 저장
        )
        
        logger.info(f"SOD2 평가 완료 - 환자: {patient.display_name}, 나이: {final_age}, 성별: {final_gender}, 평가 ID: {sod2_assessment.id}")
        
        return Response({
            'assessment_id': sod2_assessment.id,
            'result': assessment_result
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"SOD2 평가 중 오류: {e}", exc_info=True)
        return Response(
            {'error': f'SOD2 평가 실패: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_sod2_assessments(request, patient_uuid):
    """환자의 SOD2 평가 이력 조회 - 환자 정보 확실히 표시"""
    try:
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        # SOD2 평가 이력 조회
        assessments = SOD2Analysis.objects.filter(
            task__patient=patient,
            task__task_type='SOD2_ASSESSMENT'
        ).order_by('-task__created_at')
        
        results = []
        for assessment in assessments:
            # ===== 확실한 나이/성별 표시 =====
            # DB에 저장된 실제 값 사용
            age_display = f"{assessment.age}세" if assessment.age and assessment.age > 0 else 'N/A'
            gender_display = '남성' if assessment.gender == 'M' else '여성' if assessment.gender == 'F' else 'N/A'
            
            # ===== 모니터링 일정 올바른 표시 =====
            monitoring_display = "24시간 후 재평가"  # 기본값
            if assessment.monitoring_schedule:
                if isinstance(assessment.monitoring_schedule, dict):
                    monitoring_display = assessment.monitoring_schedule.get('text', monitoring_display)
                elif isinstance(assessment.monitoring_schedule, str):
                    monitoring_display = assessment.monitoring_schedule
            
            # 안전한 재관류 시간 표시
            reperfusion_time_display = None
            if assessment.reperfusion_treatment and assessment.reperfusion_time is not None:
                reperfusion_time_display = f"{assessment.reperfusion_time}시간"
            
            result_data = {
                'id': assessment.id,
                'recorded_at': assessment.task.created_at.isoformat(),
                'patient_info': {
                    'age': assessment.age,
                    'age_display': age_display,
                    'gender': assessment.gender,
                    'gender_display': gender_display,
                },
                # 호환성을 위해 최상위에도 추가
                'age': assessment.age,
                'gender': assessment.gender,
                'current_sod2_level': assessment.current_sod2_level,
                'oxidative_stress_risk': assessment.oxidative_stress_risk,
                'overall_status': getattr(assessment, 'overall_antioxidant_status', None),
                'exercise_can_start': assessment.exercise_can_start,
                'exercise_intensity': assessment.exercise_intensity,
                'nihss_score': assessment.nihss_score,
                'stroke_type': assessment.stroke_type,
                'hours_after_stroke': assessment.hours_after_stroke,
                'sod2_prediction_data': assessment.sod2_prediction_data,
                'clinical_recommendations': assessment.clinical_recommendations.split('\n') if assessment.clinical_recommendations else [],
                'exercise_recommendations': assessment.exercise_recommendations,
                'prediction_confidence': assessment.prediction_confidence,
                'monitoring_schedule_display': monitoring_display,  # 표시용
                'stroke_info': {
                    'stroke_type': assessment.stroke_type,
                    'nihss_score': assessment.nihss_score,
                    'reperfusion_treatment': assessment.reperfusion_treatment,
                    'reperfusion_time': assessment.reperfusion_time,
                    'reperfusion_time_display': reperfusion_time_display,
                    'stroke_date': assessment.stroke_date.isoformat() if assessment.stroke_date else None,
                    'hours_after_stroke': assessment.hours_after_stroke,
                },
                'notes': assessment.task.input_data.get('notes', '')
            }
            results.append(result_data)
        
        return Response({
            'patient_uuid': patient_uuid,
            'patient_display': patient.display_name,
            'assessments': results,
            'total_count': len(results)
        })
        
    except Exception as e:
        logger.error(f"SOD2 평가 이력 조회 중 오류: {e}", exc_info=True)
        return Response(
            {'error': f'SOD2 평가 이력 조회 실패: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_latest_sod2_assessment(request, patient_uuid):
    """환자의 최신 SOD2 평가 결과 조회"""
    try:
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        # 최신 SOD2 평가 결과 조회
        latest_assessment = SOD2Analysis.objects.filter(
            task__patient=patient, # task__patient로 필터링
            task__task_type='SOD2_ASSESSMENT'
        ).order_by('-task__created_at').first()
        
        if not latest_assessment:
            return Response({
                'message': '해당 환자의 SOD2 평가 결과가 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        result = {
            'id': latest_assessment.id,
            'recorded_at': latest_assessment.task.created_at.isoformat(),
            'current_sod2_level': latest_assessment.current_sod2_level,
            'oxidative_stress_risk': latest_assessment.oxidative_stress_risk,
            'overall_status': getattr(latest_assessment, 'overall_antioxidant_status', None),
            'exercise_can_start': latest_assessment.exercise_can_start,
            'exercise_intensity': latest_assessment.exercise_intensity,
            'nihss_score': latest_assessment.nihss_score,
            'stroke_type': latest_assessment.stroke_type,
            'hours_after_stroke': latest_assessment.hours_after_stroke,
            'sod2_prediction_data': latest_assessment.sod2_prediction_data,
            'clinical_recommendations': latest_assessment.clinical_recommendations.split('\n') if latest_assessment.clinical_recommendations else [],
            'exercise_recommendations': latest_assessment.exercise_recommendations,
            'prediction_confidence': latest_assessment.prediction_confidence,
            'stroke_info': { # 클라이언트에서 SOD2 정보를 쉽게 파싱할 수 있도록 추가
                'stroke_type': latest_assessment.stroke_type,
                'nihss_score': latest_assessment.nihss_score,
                'reperfusion_treatment': latest_assessment.reperfusion_treatment,
                'reperfusion_time': latest_assessment.reperfusion_time,
                'stroke_date': latest_assessment.stroke_date.isoformat() if latest_assessment.stroke_date else None,
                'hours_after_stroke': latest_assessment.hours_after_stroke,
            },
            'notes': latest_assessment.task.input_data.get('notes', '')
        }
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"최신 SOD2 평가 조회 중 오류: {e}", exc_info=True)
        return Response(
            {'error': f'최신 SOD2 평가 조회 실패: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def sod2_analysis(request, patient_uuid):
    """SOD2 (뇌졸중) 분석 - 기존 API 호환성 유지"""
    try:
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        if request.method == 'GET':
            # 기존 SOD2 분석 결과 조회
            try:
                # task__patient 필터링 추가 (patient_uuid와 일치하는 환자만)
                sod2_result = SOD2Analysis.objects.filter(
                    task__patient=patient, # 이 부분 추가
                    task__task_type='SOD2_ASSESSMENT'
                ).order_by('-task__created_at').first()
                
                if not sod2_result:
                    return Response({
                        'message': '아직 SOD2 분석이 수행되지 않았습니다.'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                return Response({
                    'nihss_score': sod2_result.nihss_score,
                    'stroke_type': sod2_result.stroke_type,
                    'reperfusion_treatment': sod2_result.reperfusion_treatment,
                    'reperfusion_time': sod2_result.reperfusion_time,
                    'hours_after_stroke': sod2_result.hours_after_stroke,
                    'current_sod2_level': sod2_result.current_sod2_level,
                    'oxidative_stress_risk': sod2_result.oxidative_stress_risk,
                    'analysis_results': {
                        'current_level': sod2_result.current_sod2_level,
                        'risk_level': sod2_result.oxidative_stress_risk,
                        'exercise_can_start': sod2_result.exercise_can_start,
                        'exercise_intensity': sod2_result.exercise_intensity
                    },
                    'created_at': sod2_result.task.created_at.isoformat() # 날짜/시간 포맷 통일
                })
            except Exception as e:
                logger.error(f"SOD2 분석 조회 중 오류: {e}", exc_info=True)
                return Response({
                    'message': f'SOD2 분석 조회 중 오류: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        elif request.method == 'POST':
            # 새로운 SOD2 분석 수행 - assess_sod2_status API로 리다이렉트
            data = request.data.copy()
            data['patient'] = str(patient.uuid) # patient_uuid를 data에 추가
            
            # 데이터 구조 변환
            if 'nihss_score' in data:
                if 'stroke_info' not in data:
                    data['stroke_info'] = {}
                data['stroke_info']['nihss_score'] = data['nihss_score']
                data['stroke_info']['stroke_type'] = data.get('stroke_type', 'ischemic_reperfusion')
                data['stroke_info']['reperfusion_treatment'] = data.get('reperfusion_treatment', False)
                data['stroke_info']['reperfusion_time'] = data.get('reperfusion_time')
                data['stroke_info']['stroke_date'] = data.get('stroke_date')
                data['stroke_info']['hours_after_stroke'] = data.get('hours_after_stroke')
            
            # ⭐⭐⭐ 중요한 변경: sod2_analysis (POST)는 이제 ml_service를 직접 호출합니다. ⭐⭐⭐
            try:
                # 필요한 데이터 추출 및 가공
                sod2_input_data = {
                    'patient': str(patient.uuid),
                    'age': data.get('age', 65), # 기본값 제공
                    'gender': data.get('gender', patient.gender),
                    'stroke_info': data.get('stroke_info', {})
                }
                
                assessment_result = sod2_service.assess_sod2_status(sod2_input_data)
                
                if 'error' in assessment_result:
                    return Response({'error': assessment_result['error']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # 예측 결과를 데이터베이스에 저장 (assess_sod2_status 뷰의 저장 로직과 유사)
                prediction_task = PredictionTask.objects.create(
                    task_id=uuid.uuid4(),
                    patient=patient,
                    task_type='SOD2_ASSESSMENT',
                    input_data=sod2_input_data,
                    predictions=assessment_result,
                    # created_by=request.user if request.user.is_authenticated else None # ⭐ created_by 인자 제거
                )

                # SOD2Analysis 객체 생성 (assess_sod2_status 뷰의 해당 부분 복사)
                stroke_date_str = data.get('stroke_info', {}).get('stroke_date') or data.get('stroke_date')
                stroke_date = None
                if stroke_date_str:
                    try:
                        if isinstance(stroke_date_str, str):
                            stroke_date = datetime.strptime(stroke_date_str, '%Y-%m-%d').date()
                        else:
                            stroke_date = stroke_date_str
                    except ValueError:
                        logger.warning(f"날짜 형식 오류: {stroke_date_str}")
                
                # ===== SOD2 수준에 따른 동적 모니터링 일정 =====
                current_sod2_level = assessment_result['sod2_status']['current_level']
                
                if current_sod2_level >= 0.9:  # 90% 이상
                    monitoring_text = "주간 SOD2 수준 확인"
                elif current_sod2_level >= 0.85:  # 85-89%
                    monitoring_text = "격일 SOD2 수준 확인"
                elif current_sod2_level >= 0.7:  # 70-84%
                    monitoring_text = "48시간 후 재평가"
                elif current_sod2_level >= 0.5:  # 50-69%
                    monitoring_text = "24시간 후 재평가"
                else:  # 50% 미만
                    monitoring_text = "12시간 후 재평가"
                
                sod2_assessment = SOD2Analysis.objects.create(
                    task=prediction_task,
                    age=assessment_result['patient_info']['age'],
                    gender=assessment_result['patient_info']['gender'],
                    stroke_type=assessment_result['patient_info']['stroke_type'],
                    stroke_date=stroke_date,
                    nihss_score=assessment_result['patient_info']['nihss_score'],
                    reperfusion_treatment=assessment_result['patient_info'].get('reperfusion_treatment', False),
                    reperfusion_time=assessment_result['patient_info'].get('reperfusion_time'),
                    hours_after_stroke=assessment_result['patient_info']['hours_after_stroke'],
                    current_sod2_level=assessment_result['sod2_status']['current_level'],
                    sod2_prediction_data=assessment_result['sod2_prediction_data'],
                    oxidative_stress_risk=assessment_result['sod2_status']['oxidative_stress_risk'],
                    prediction_confidence=assessment_result['sod2_status']['prediction_confidence'],
                    exercise_can_start=assessment_result['exercise_recommendations']['can_start'],
                    exercise_intensity=assessment_result['exercise_recommendations']['intensity'],
                    exercise_start_time=assessment_result['exercise_recommendations'].get('time_until_start'),
                    sod2_target_level=assessment_result['exercise_recommendations']['sod2_target'],
                    age_adjustment_factor=assessment_result['personalization_factors']['age_adjustment'],
                    stroke_type_adjustment=assessment_result['personalization_factors']['stroke_type_adjustment'],
                    nihss_adjustment=assessment_result['personalization_factors']['nihss_adjustment'],
                    reperfusion_timing_adjustment=assessment_result['personalization_factors'].get('reperfusion_timing_adjustment', 1.0),
                    clinical_recommendations='\n'.join(assessment_result['clinical_recommendations']),
                    exercise_recommendations=assessment_result['exercise_recommendations'],
                    monitoring_schedule={'text': monitoring_text}  # ★★★ 이제 monitoring_text가 정의됨 ★★★
                )
                
                logger.info(f"SOD2 분석 및 평가 완료 - 환자: {patient.display_name}, 평가 ID: {sod2_assessment.id}")

                return Response({
                    'assessment_id': sod2_assessment.id,
                    'result': assessment_result
                }, status=status.HTTP_201_CREATED)

            except Exception as inner_e:
                logger.error(f"SOD2 분석 처리 중 내부 오류: {inner_e}", exc_info=True)
                return Response(
                    {'error': f'SOD2 분석 처리 중 내부 오류가 발생했습니다: {str(inner_e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
    except Exception as e:
        logger.error(f"SOD2 분석 실패 (GET/POST 공통): {e}", exc_info=True)
        return Response(
            {'error': f'SOD2 분석 중 오류가 발생했습니다: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def save_complications_medications(request, patient_uuid):
    """합병증 및 투약 정보 저장"""
    try:
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        data = request.data
        
        # 여기서 ComplicationPrediction 모델 또는 다른 관련 모델에 저장하는 로직이 필요
        # 현재는 단순히 데이터만 반환하고 있습니다.
        # 예:
        # PredictionResult.objects.create(
        #     patient=patient,
        #     prediction_type='complications_medications_record',
        #     input_data=data,
        #     predictions={'complications': data.get('complications', {}), 'medications': data.get('medications', {})},
        #     created_by=request.user if request.user.is_authenticated else None
        # )

        return Response({
            'message': '합병증 및 투약 정보가 저장되었습니다.',
            'complications': data.get('complications', {}),
            'medications': data.get('medications', {})
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"합병증/투약 정보 저장 실패: {e}", exc_info=True)
        return Response(
            {'error': f'정보 저장 중 오류가 발생했습니다: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# @api_view(['GET', 'POST'])
# @permission_classes([AllowAny])
# def lis_lab_results(request, patient_uuid):
#     """LIS 검사 결과 관리"""
#     try:
#         patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
#         if request.method == 'GET':
#             # LabResult 모델이 OpenMRSPatient를 참조하는지 확인 후 필터링
#             # lab_results = LabResult.objects.filter(patient=patient).order_by('-test_date')
#             lab_results = LabResult.objects.filter(patient=patient).order_by('-recorded_at') # 추교상넌할수있어
#             results_data = []
#             for result in lab_results:
#                 results_data.append({
#                     'id': result.id,
#                     'patient_uuid': str(result.patient.uuid), # 환자 UUID 추가
#                     'test_type': result.test_type,
#                     'test_name': result.test_name,
#                     'test_value': float(result.value), # 문자열을 숫자로 변환
#                     'unit': result.unit,
#                     'reference_range': result.reference_range,
#                     # 'recorded_at': result.test_date.isoformat(), # 필드 이름 recorded_at으로 통일
#                     'recorded_at': result.recorded_at.isoformat(), # 추교상넌할수있어
#                     'is_abnormal': result.is_abnormal,
#                     'notes': getattr(result, 'notes', '') # notes 필드가 있다면
#                 })
            
#             return Response({
#                 'lab_results': results_data,
#                 'total_count': len(results_data)
#             })
            
#         elif request.method == 'POST':
#             # 새로운 검사 결과 저장
#             data = request.data
            
#             # 클라이언트에서 보낸 데이터 구조에 따라 수정
#             # 예: { "patient": "uuid", "test_name": "...", "test_value": ..., "unit": "...", "recorded_at": "..." }
#             test_name = data.get('test_name')
#             test_value = data.get('test_value')
#             unit = data.get('unit')
#             notes = data.get('notes', '')
#             recorded_at_str = data.get('recorded_at')

#             if not all([test_name, test_value, unit, recorded_at_str]):
#                 return Response({'error': '필수 검사 결과 데이터가 누락되었습니다.'}, status=status.HTTP_400_BAD_REQUEST)

#             try:
#                 # datetime-local 형식 (YYYY-MM-DDTHH:MM)을 파싱
#                 recorded_at = datetime.fromisoformat(recorded_at_str)
#             except ValueError:
#                 return Response({'error': '유효하지 않은 날짜/시간 형식입니다.'}, status=status.HTTP_400_BAD_REQUEST)

#             # LabResult 객체 생성 및 저장
#             lab_result = LabResult.objects.create(
#                 patient=patient, # 환자 인스턴스 연결
#                 test_type='routine', # 필요하다면 클라이언트에서 받거나 기본값 설정
#                 test_name=test_name,
#                 value=str(test_value), # 문자열로 저장
#                 unit=unit,
#                 test_date=recorded_at.date(), # 날짜만 저장 (test_date 필드가 DateField라면)
#                 recorded_at=recorded_at, # DateTimeField가 있다면 recorded_at으로
#                 is_abnormal=False, # 필요하다면 로직 추가
#                 notes=notes,
#                 # created_by=request.user if request.user.is_authenticated else None # created_by 필드가 있다면
#             )
            
#             return Response({
#                 'message': '검사 결과가 성공적으로 저장되었습니다.',
#                 'saved_result': {
#                     'id': lab_result.id,
#                     'patient_uuid': str(lab_result.patient.uuid),
#                     'test_name': lab_result.test_name,
#                     'test_value': float(lab_result.value),
#                     'unit': lab_result.unit,
#                     'recorded_at': lab_result.recorded_at.isoformat(),
#                     'notes': lab_result.notes
#                 }
#             }, status=status.HTTP_201_CREATED)
            
#     except Exception as e:
#         logger.error(f"검사 결과 관리 실패: {e}", exc_info=True)
#         return Response(
#             {'error': f'검사 결과 처리 중 오류가 발생했습니다: {str(e)}'}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )
# 추교상넌할수있어
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def lis_lab_results(request, patient_uuid):
    """LIS 검사 결과 관리 (최종 수정 버전)"""
    try:
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        if request.method == 'GET':
            # lab_results = LabResult.objects.filter(patient=patient).order_by('-recorded_at')
            # 추교상넌할수있어
            lab_results = LabResult.objects.filter(patient__uuid=patient_uuid).order_by('-recorded_at')
            
            results_data = []
            for result in lab_results:
                results_data.append({
                    'id': result.id,
                    'patient_uuid': str(result.patient.uuid),
                    'test_type': result.test_name, # 모델에 test_type이 없으므로 test_name 사용
                    'test_name': result.test_name,
                    # ✅✅✅ result.value -> result.test_value 로 수정
                    'test_value': float(result.test_value), 
                    'unit': result.unit,
                    'reference_range': getattr(result, 'reference_range', ''), 
                    'recorded_at': result.recorded_at.isoformat(),
                    'is_abnormal': getattr(result, 'is_abnormal', False),
                    'notes': getattr(result, 'notes', '')
                })
            
            return Response({
                'lab_results': results_data,
                'total_count': len(results_data)
            })
            
        elif request.method == 'POST':
            # POST 로직도 모델 필드명에 맞게 수정
            data = request.data
            test_name = data.get('test_name')
            test_value = data.get('test_value')
            unit = data.get('unit')
            notes = data.get('notes', '')
            recorded_at_str = data.get('recorded_at')

            if not all([test_name, test_value, unit, recorded_at_str]):
                return Response({'error': '필수 검사 결과 데이터가 누락되었습니다.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                recorded_at = datetime.fromisoformat(recorded_at_str)
            except ValueError:
                return Response({'error': '유효하지 않은 날짜/시간 형식입니다.'}, status=status.HTTP_400_BAD_REQUEST)

            # ✅✅✅ create 구문에서 모델에 없는 test_date 필드 제거, value -> test_value로 수정
            lab_result = LabResult.objects.create(
                patient=patient,
                test_name=test_name,
                test_value=test_value,
                unit=unit,
                recorded_at=recorded_at,
                notes=notes,
            )
            return Response({'message': '성공'}, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"검사 결과 관리 실패: {e}", exc_info=True)
        return Response(
            {'error': f'검사 결과 처리 중 오류가 발생했습니다: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
# 추교상넌할수있어
@api_view(['GET'])
@permission_classes([AllowAny])
def get_prediction_results(request, patient_uuid):
    """환자의 모든 최신 예측 결과를 통합하여 조회 (수정된 최종 버전)"""
    try:
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        # -----------------------------------------------------------------
        # 1. 최신 합병증 예측 결과 조회
        # -----------------------------------------------------------------
        # 가장 최근의 'COMPLICATION' 타입 Task를 찾습니다.
        latest_complication_task = PredictionTask.objects.filter(
            patient=patient,
            task_type='COMPLICATION'
        ).order_by('-created_at').first()

        complications_data = {}
        # Task가 존재하고, 그 안에 예측 결과(JSON)가 있으면 데이터를 추출합니다.
        if latest_complication_task and latest_complication_task.predictions:
            predictions = latest_complication_task.predictions
            complications_data = {
                # 프론트엔드 컴포넌트가 전체 result 객체를 원하므로 그대로 전달합니다.
                'pneumonia': predictions.get('pneumonia', {}),
                'acute_kidney_injury': predictions.get('acute_kidney_injury', {}),
                'heart_failure': predictions.get('heart_failure', {})
            }
        
        # -----------------------------------------------------------------
        # 2. 최신 사망률 예측 결과 조회
        # -----------------------------------------------------------------
        # 가장 최근의 'MORTALITY' 타입 Task에 연결된 StrokeMortalityPrediction 객체를 찾습니다.
        latest_mortality_prediction = StrokeMortalityPrediction.objects.filter(
            task__patient=patient,
            task__task_type='MORTALITY'
        ).order_by('-task__created_at').first()

        mortality_data = {}
        if latest_mortality_prediction:
            # 프론트엔드 컴포넌트가 필요로 하는 모든 필드를 담아줍니다.
            mortality_data = {
                'mortality_30_day': latest_mortality_prediction.mortality_30_day,
                'mortality_30_day_risk_level': latest_mortality_prediction.mortality_30_day_risk_level,
                'model_confidence': latest_mortality_prediction.model_confidence,
                'model_auc': latest_mortality_prediction.model_auc,
                'risk_factors': latest_mortality_prediction.risk_factors,
                'clinical_recommendations': latest_mortality_prediction.clinical_recommendations,
                'predicted_at': latest_mortality_prediction.task.created_at.isoformat()
            }

        # -----------------------------------------------------------------
        # 3. 최종 응답 데이터 구성
        # -----------------------------------------------------------------
        # 프론트엔드 요약 컴포넌트가 데이터를 쉽게 찾을 수 있도록 키 이름을 명확히 합니다.
        response_data = {
            'complication_prediction': complications_data,
            'mortality_prediction': mortality_data,
        }
        
        all_tasks = PredictionTask.objects.filter(patient=patient, task_type__in=['COMPLICATION', 'MORTALITY']).order_by('-created_at')
        last_updated = all_tasks.first().created_at.isoformat() if all_tasks.exists() else None
        
        return Response({
            'patient_uuid': str(patient.uuid),
            'latest_predictions': response_data,
            'last_updated': last_updated
        })
        
    except Exception as e:
        logger.error(f"최신 예측 결과 통합 조회 실패: {e}", exc_info=True)
        return Response(
            {'error': f'최신 예측 결과를 조회할 수 없습니다: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
# @api_view(['GET'])
# @permission_classes([AllowAny])
# def get_prediction_results(request, patient_uuid):
#     """환자의 모든 예측 결과 조회"""
#     try:
#         patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
#         # 최신 예측 결과들 가져오기 - 모델 관계 확인 필요
#         complications_prediction = ComplicationPrediction.objects.filter(
#             task__patient=patient, # task__patient로 필터링
#             complication_type='complications'
#         ).order_by('-task__created_at').first()
        
#         sod2_analysis = SOD2Analysis.objects.filter(
#             task__patient=patient, # task__patient로 필터링
#             task__task_type='SOD2_ASSESSMENT'
#         ).order_by('-task__created_at').first()
        
#         # 차트 데이터 준비
#         chart_data = {
#             'complications': {},
#             'mortality': {}, # 사망률 예측 결과는 별도 API나 모델에서 가져와야 함
#             'sod2_scores': {}
#         }
        
#         if complications_prediction:
#             results = complications_prediction.task.predictions # predictions 필드 사용
#             chart_data['complications'] = {
#                 'pneumonia': results.get('pneumonia', {}).get('probability', 0),
#                 'acute_kidney_injury': results.get('acute_kidney_injury', {}).get('probability', 0),
#                 'heart_failure': results.get('heart_failure', {}).get('probability', 0)
#             }
        
#         if sod2_analysis:
#             # SOD2 결과에서 mortality_30_day와 risk_level은 직접 매핑
#             chart_data['mortality'] = {
#                 'mortality_30_day': sod2_analysis.sod2_prediction_data.get('mortality_30_day', 0.1), # SOD2 데이터에 사망률 정보가 있다면
#                 'risk_level': sod2_analysis.oxidative_stress_risk.upper() if sod2_analysis.oxidative_stress_risk else 'LOW'
#             }
#             chart_data['sod2_scores'] = {
#                 'nihss_score': sod2_analysis.nihss_score or 0,
#                 'current_sod2_level': sod2_analysis.current_sod2_level or 0,
#                 'exercise_intensity': sod2_analysis.exercise_intensity or 0
#             }
        
#         return Response({
#             'patient_uuid': str(patient.uuid),
#             'chart_data': chart_data,
#             'last_updated': complications_prediction.task.created_at.isoformat() if complications_prediction and complications_prediction.task.created_at else None
#         })
        
#     except Exception as e:
#         logger.error(f"예측 결과 조회 실패: {e}", exc_info=True)
#         return Response(
#             {'error': f'예측 결과를 조회할 수 없습니다: {str(e)}'}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )

# ============= 합병증 예측 API (수정된 버전) =============

@api_view(['POST'])
@permission_classes([AllowAny])
def predict_complications(request):
    """합병증 예측 API - 실제 ML 모델 사용"""
    try:
        data = request.data
        patient_uuid = data.get('patient_uuid')
        
        if not patient_uuid:
            return Response(
                {'error': '환자 UUID가 필요합니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 환자 조회
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        logger.info(f"합병증 예측 시작 - 환자: {patient.display_name}")
        
        # ML 서비스를 통한 예측 실행
        prediction_results = ml_service.predict_complications(data)
        
        # PredictionTask 생성
        task = PredictionTask.objects.create(
            patient=patient,
            task_type='COMPLICATION',
            status='COMPLETED',
            input_data=data,
            predictions=prediction_results,
            processing_time=prediction_results.get('processing_time', 0),
            requested_by=request.user if request.user.is_authenticated else None
        )
        
        # 각 합병증별로 ComplicationPrediction 레코드 생성
        complications = ['pneumonia', 'acute_kidney_injury', 'heart_failure']
        created_predictions = []
        
        for comp in complications:
            if comp in prediction_results:
                comp_result = prediction_results[comp]
                
                # ComplicationPrediction 생성
                comp_prediction = ComplicationPrediction.objects.create(
                    task=task,
                    complication_type=comp,
                    probability=comp_result.get('probability', 0),
                    risk_level=comp_result.get('risk_level', 'LOW'),
                    threshold=comp_result.get('threshold', 0.5),
                    model_auc=comp_result.get('model_performance', {}).get('auc', 0),
                    model_precision=comp_result.get('model_performance', {}).get('precision', 0),
                    model_recall=comp_result.get('model_performance', {}).get('recall', 0),
                    model_f1=comp_result.get('model_performance', {}).get('f1', 0),
                    model_type=comp_result.get('model_performance', {}).get('type', 'ensemble'),
                    model_strategy=comp_result.get('model_performance', {}).get('strategy', 'supervised'),
                    important_features={}  # 추후 기능 중요도 추가 가능
                )
                created_predictions.append(comp_prediction)
        
        logger.info(f"합병증 예측 완료 - Task ID: {task.task_id}")
        
        # 응답 데이터 구성
        response_data = {
            'task_id': str(task.task_id),
            'patient_uuid': str(patient.uuid),
            'predictions': prediction_results,
            'created_at': task.created_at.isoformat(),
            'model_used': prediction_results.get('model_used', False)
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"합병증 예측 중 오류: {e}", exc_info=True)
        return Response(
            {'error': f'합병증 예측 중 오류가 발생했습니다: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ============= 사망률 예측 API (수정된 버전) =============

@api_view(['POST'])
@permission_classes([AllowAny])
def predict_mortality(request):
    """사망률 예측 API - 실제 ML 모델 사용"""
    try:
        data = request.data
        patient_uuid = data.get('patient_uuid')
        
        if not patient_uuid:
            return Response(
                {'error': '환자 UUID가 필요합니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 환자 조회
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        logger.info(f"사망률 예측 시작 - 환자: {patient.display_name}")
        
        # ML 서비스를 통한 예측 실행
        mortality_results = ml_service.predict_mortality(data)
        
        # PredictionTask 생성
        task = PredictionTask.objects.create(
            patient=patient,
            task_type='MORTALITY',
            status='COMPLETED',
            input_data=data,
            predictions=mortality_results,
            processing_time=mortality_results.get('processing_time', 0),
            requested_by=request.user if request.user.is_authenticated else None
        )
        
        # StrokeMortalityPrediction 생성
        mortality_prediction = StrokeMortalityPrediction.objects.create(
            task=task,
            mortality_30_day=mortality_results.get('mortality_30_day', 0),
            mortality_30_day_risk_level=mortality_results.get('risk_level', 'LOW'),
            mortality_in_hospital=mortality_results.get('mortality_in_hospital'),
            mortality_90_day=mortality_results.get('mortality_90_day'),
            mortality_1_year=mortality_results.get('mortality_1_year'),
            stroke_type=data.get('stroke_type', 'unknown'),
            nihss_score=data.get('nihss_score'),
            reperfusion_treatment=data.get('reperfusion_treatment', False),
            reperfusion_time=data.get('reperfusion_time'),
            risk_factors=mortality_results.get('risk_factors', []),
            protective_factors=mortality_results.get('protective_factors', []),
            model_confidence=mortality_results.get('confidence', 0),
            model_auc=mortality_results.get('model_performance', {}).get('auc', 0),
            clinical_recommendations='; '.join(mortality_results.get('clinical_recommendations', [])),
            monitoring_priority=mortality_results.get('risk_level', 'LOW')
        )
        
        logger.info(f"사망률 예측 완료 - Task ID: {task.task_id}, 확률: {mortality_results.get('mortality_30_day', 0):.3f}")
        
        # 응답 데이터 구성
        response_data = {
            'task_id': str(task.task_id),
            'patient_uuid': str(patient.uuid),
            'mortality_30_day': mortality_results.get('mortality_30_day', 0),
            'risk_level': mortality_results.get('risk_level', 'LOW'),
            'confidence': mortality_results.get('confidence', 0),
            'risk_factors': mortality_results.get('risk_factors', []),
            'protective_factors': mortality_results.get('protective_factors', []),
            'clinical_recommendations': mortality_results.get('clinical_recommendations', []),
            'model_performance': mortality_results.get('model_performance', {}),
            'created_at': task.created_at.isoformat(),
            'model_used': mortality_results.get('model_used', False)
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"사망률 예측 중 오류: {e}", exc_info=True)
        return Response(
            {'error': f'사망률 예측 중 오류가 발생했습니다: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ============= 데이터 등록 API (새로 추가) =============

@api_view(['POST'])
@permission_classes([AllowAny])
def register_complications_data(request):
    """합병증 및 투약 정보 등록 API"""
    try:
        data = request.data
        patient_uuid = data.get('patient_uuid') or data.get('patient')
        
        if not patient_uuid:
            return Response(
                {'error': '환자 UUID가 필요합니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 환자 조회
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        logger.info(f"합병증 데이터 등록 - 환자: {patient.display_name}")
        
        # 데이터 검증
        complications = data.get('complications', {})
        medications = data.get('medications', {})
        recorded_at = data.get('recorded_at')
        
        if recorded_at:
            try:
                recorded_datetime = datetime.fromisoformat(recorded_at.replace('Z', '+00:00'))
            except:
                recorded_datetime = timezone.now()
        else:
            recorded_datetime = timezone.now()
        
        # PredictionTask로 저장
        task = PredictionTask.objects.create(
            patient=patient,
            task_type='COMPLICATION',
            status='COMPLETED',
            input_data={
                'complications': complications,
                'medications': medications,
                'recorded_at': recorded_at,
                'notes': data.get('notes', '')
            },
            predictions={
                'data_registered': True,
                'complications_count': len([k for k, v in complications.items() if v]),
                'medications_count': len([k for k, v in medications.items() if v])
            },
            requested_by=request.user if request.user.is_authenticated else None
        )
        
        response_data = {
            'task_id': str(task.task_id),
            'patient_uuid': str(patient.uuid),
            'message': '합병증 및 투약 정보가 성공적으로 등록되었습니다.',
            'registered_at': task.created_at.isoformat()
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"합병증 데이터 등록 중 오류: {e}", exc_info=True)
        return Response(
            {'error': f'데이터 등록 중 오류가 발생했습니다: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def register_mortality_data(request):
    """사망률 예측용 데이터 등록 API"""
    try:
        data = request.data
        patient_uuid = data.get('patient_uuid') or data.get('patient')
        
        if not patient_uuid:
            return Response(
                {'error': '환자 UUID가 필요합니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 환자 조회
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        logger.info(f"사망률 데이터 등록 - 환자: {patient.display_name}")
        
        # PredictionTask로 저장
        task = PredictionTask.objects.create(
            patient=patient,
            task_type='MORTALITY',
            status='COMPLETED',
            input_data=data,
            predictions={
                'data_registered': True,
                'has_vital_signs': bool(data.get('vital_signs')),
                'has_lab_results': bool(data.get('lab_results')),
                'nihss_score': data.get('nihss_score')
            },
            requested_by=request.user if request.user.is_authenticated else None
        )
        
        response_data = {
            'task_id': str(task.task_id),
            'patient_uuid': str(patient.uuid),
            'message': '사망률 예측용 데이터가 성공적으로 등록되었습니다.',
            'registered_at': task.created_at.isoformat()
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"사망률 데이터 등록 중 오류: {e}", exc_info=True)
        return Response(
            {'error': f'데이터 등록 중 오류가 발생했습니다: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ============= 이력 조회 API (새로 추가) =============

@api_view(['GET'])
@permission_classes([AllowAny])
def get_complications_history(request, patient_uuid):
    """합병증 예측 이력 조회"""
    try:
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        # 합병증 관련 예측 작업들 조회
        tasks = PredictionTask.objects.filter(
            patient=patient,
            task_type='COMPLICATION'
        ).order_by('-created_at')[:20]
        
        history = []
        for task in tasks:
            # ComplicationPrediction 레코드들 조회
            predictions = ComplicationPrediction.objects.filter(task=task)
            
            task_data = {
                'task_id': str(task.task_id),
                'created_at': task.created_at.isoformat(),
                'status': task.status,
                'input_data': task.input_data,
                'predictions': {}
            }
            
            # 각 합병증별 예측 결과 추가
            for pred in predictions:
                task_data['predictions'][pred.complication_type] = {
                    'probability': pred.probability,
                    'risk_level': pred.risk_level,
                    'model_performance': {
                        'auc': pred.model_auc,
                        'precision': pred.model_precision,
                        'recall': pred.model_recall,
                        'f1': pred.model_f1
                    }
                }
            
            # 입력 데이터만 있는 경우 (등록만 한 경우)
            if not predictions.exists() and task.input_data:
                task_data['data_type'] = 'registration_only'
                task_data['complications'] = task.input_data.get('complications', {})
                task_data['medications'] = task.input_data.get('medications', {})
            
            history.append(task_data)
        
        return Response({
            'patient_uuid': str(patient.uuid),
            'history': history,
            'total_count': len(history)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"합병증 이력 조회 중 오류: {e}", exc_info=True)
        return Response(
            {'error': f'이력 조회 중 오류가 발생했습니다: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_mortality_history(request, patient_uuid):
    """사망률 예측 이력 조회"""
    try:
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        # 사망률 관련 예측 작업들 조회
        tasks = PredictionTask.objects.filter(
            patient=patient,
            task_type='MORTALITY'
        ).order_by('-created_at')[:20]
        
        history = []
        for task in tasks:
            # StrokeMortalityPrediction 레코드 조회
            try:
                mortality_pred = StrokeMortalityPrediction.objects.get(task=task)
                task_data = {
                    'task_id': str(task.task_id),
                    'created_at': task.created_at.isoformat(),
                    'status': task.status,
                    'mortality_30_day': mortality_pred.mortality_30_day,
                    'risk_level': mortality_pred.mortality_30_day_risk_level,
                    'confidence': mortality_pred.model_confidence,
                    'nihss_score': mortality_pred.nihss_score,
                    'stroke_type': mortality_pred.stroke_type,
                    'reperfusion_treatment': mortality_pred.reperfusion_treatment,
                    'clinical_recommendations': mortality_pred.clinical_recommendations
                }
            except StrokeMortalityPrediction.DoesNotExist:
                # 예측 결과가 없으면 입력 데이터만 표시
                task_data = {
                    'task_id': str(task.task_id),
                    'created_at': task.created_at.isoformat(),
                    'status': task.status,
                    'data_type': 'registration_only',
                    'input_data': task.input_data
                }
            
            history.append(task_data)
        
        return Response({
            'patient_uuid': str(patient.uuid),
            'history': history,
            'total_count': len(history)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"사망률 이력 조회 중 오류: {e}", exc_info=True)
        return Response(
            {'error': f'이력 조회 중 오류가 발생했습니다: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
# ============= 기존 API 호환성 유지 =============

@api_view(['POST'])
@permission_classes([AllowAny])
def predict_stroke_mortality(request):
    """기존 API 호환성을 위한 래퍼"""
    return predict_mortality(request)

@api_view(['POST'])
@permission_classes([AllowAny])
def submit_mortality_prediction_data(request):
    """사망률 예측 데이터 수동 등록 (의료진 검토 후)"""
    try:
        data = request.data
        patient_uuid = data.get('patient_uuid')
        
        if not patient_uuid:
            logger.error("사망률 예측 데이터 등록에 patient_uuid가 없습니다.")
            return Response(
                {'error': 'patient_uuid가 필요합니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        patient_instance = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        logger.info(f"사망률 예측 데이터 수동 등록 요청 수신 (환자: {patient_uuid})")
        
        # 의료진이 검토한 데이터로 별도 저장
        prediction_task = PredictionTask.objects.create(
            task_id=uuid.uuid4(),
            patient=patient_instance,
            task_type='MORTALITY_PREDICTION_30DAY_MANUAL',  # 수동 등록 구분
            status='COMPLETED',
            input_data=data,
            predictions=data.get('prediction_result', {}),
        )
        
        logger.info(f"사망률 예측 데이터 수동 등록 완료 (환자: {patient_uuid}, Task ID: {prediction_task.task_id})")
        
        return Response({
            'success': True,
            'message': '사망률 예측 데이터가 성공적으로 등록되었습니다.',
            'task_id': str(prediction_task.task_id)
        })
        
    except Exception as e:
        logger.error(f"사망률 예측 데이터 등록 오류: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Gene model 관련
from .tasks import run_gene_inference_task
class GeneCSVUploadView(APIView):
    permission_classes = [AllowAny] # 필요에 따라 권한 설정

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file') # 업로드된 파일
        patient_uuid = request.data.get('patient_uuid') # 프론트엔드에서 FormData로 보낸 patient_uuid

        if file_obj is None:
            return Response({'error': '파일이 없습니다. "file" 필드로 업로드 해주세요.'}, status=status.HTTP_400_BAD_REQUEST)

        if patient_uuid is None:
            return Response({'error': '환자 UUID가 제공되지 않았습니다. "patient_uuid" 필드로 전송해주세요.'}, status=status.HTTP_400_BAD_REQUEST)

        # CSV 파일 내용을 읽어 유효성 검증 (필요한 경우) 및 처리
        try:
            # 파일 내용을 메모리에 읽어 DataFrame으로 변환
            csv_content = file_obj.read().decode('utf-8')
            df = pd.read_csv(StringIO(csv_content))

        except pd.errors.EmptyDataError:
            return Response({'error': '비어있는 CSV 파일입니다.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'CSV 파싱 실패 또는 유효성 검사 오류: {e}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Celery Task 비동기 호출
        # run_gene_inference_task는 이제 patient_uuid를 직접 받아서 사용합니다.
        # file_content는 다시 인코딩해서 보내거나, Celery 태스크에서 StringIO로 다시 읽을 수 있도록 처리.
        # file_obj.read()는 이미 위에서 한 번 읽었으므로, csv_content를 사용합니다.
        run_gene_inference_task.delay(file_content=csv_content, identifier=patient_uuid) # identifier 인자를 patient_uuid로 전달
        
        return Response({'message': f'업로드 성공. 환자ID {patient_uuid}의 추론 요청이 접수되었습니다.'}, status=status.HTTP_202_ACCEPTED)