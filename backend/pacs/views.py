# pacs/views.py

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
import logging
import pydicom
import io
import uuid
from datetime import datetime
from openmrs_integration.models import OpenMRSPatient
from django.http import HttpResponse, JsonResponse # HttpResponse, JsonResponse import 추가

from django.shortcuts import get_object_or_404 # 유정우넌할수있어
from google.cloud import storage # 유정우넌할수있어
from openmrs_integration.models import OpenMRSPatient # 유정우넌할수있어
from django.http import Http404 # 유정우넌할수있어
import tempfile # 유정우넌할수있어
import os # 유정우넌할수있어
import nibabel as nib # 유정우넌할수있어
from rest_framework.parsers import MultiPartParser, FormParser # 유정우넌할수있어
from pydicom.dataset import FileDataset, FileMetaDataset # 유정우넌할수있어
from pydicom.uid import ExplicitVRLittleEndian, generate_uid # 유정우넌할수있어
from datetime import datetime # 유정우넌할수있어
from ai_segmentation_service.segmentation_flow import process_nifti_segmentation # 유정우넌할수있어
from collections import defaultdict # 유정우넌할수있어 nnunet성공이후추가
import shutil # 유정우넌할수있어 nnunet성공이후추가
import numpy as np # 유정우넌할수있어 nnunet성공이후추가

import threading
import time
from django.core.cache import cache
from django.shortcuts import render
from django.http import StreamingHttpResponse
from .dicom_seg_converter import SegDicomConverterMixin

# from highdicom.seg.content import SegmentDescription, AlgorithmIdentificationSequence
# from highdicom.seg.sop import Segmentation

logger = logging.getLogger(__name__)
ORTHANC_AUTH = (settings.ORTHANC_USERNAME, settings.ORTHANC_PASSWORD)


class DicomUploadView(APIView):
    """새로운 DICOM 파일을 Orthanc에 업로드하는 API (UID 교체 로직 수정)"""
    def post(self, request, format=None):
        logger.info("DicomUploadView: POST 요청 수신")

        file = request.FILES.get('dicom_file')
        patient_identifier_from_request = request.data.get('patient_identifier')
        patient_uuid_from_request = request.data.get('patient_uuid')
        
        if not file:
            logger.warning("DicomUploadView: 요청에 'dicom_file' 없음")
            return Response({'error': 'DICOM 파일이 제공되지 않았습니다'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not patient_identifier_from_request and not patient_uuid_from_request:
            logger.warning("DicomUploadView: 환자 식별자가 제공되지 않음")
            return Response({'error': 'DICOM 연관을 위해 환자 식별자가 필요합니다'}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"DicomUploadView: 환자 identifier {patient_identifier_from_request} 또는 UUID {patient_uuid_from_request}에 대한 파일 '{file.name}' 처리 시작")

        try:
            dicom_bytes = file.read()
            dataset = pydicom.dcmread(io.BytesIO(dicom_bytes))
            logger.info(f"DicomUploadView: DICOM 파일 읽기 성공. Modality: {getattr(dataset, 'Modality', 'N/A')}")

            patient_instance = None
            try:
                if patient_identifier_from_request:
                    patient_instance = OpenMRSPatient.objects.get(identifier=patient_identifier_from_request)
                    logger.info(f"DicomUploadView: Found patient by identifier: {patient_identifier_from_request}")
                elif patient_uuid_from_request:
                    patient_instance = OpenMRSPatient.objects.get(uuid=patient_uuid_from_request)
                    logger.info(f"DicomUploadView: Found patient by UUID: {patient_uuid_from_request}")
                
                if patient_identifier_from_request:
                    dataset.PatientID = patient_identifier_from_request
                    logger.info(f"DicomUploadView: Set PatientID to frontend identifier: {dataset.PatientID}")
                elif patient_instance and patient_instance.identifier:
                    dataset.PatientID = patient_instance.identifier
                    logger.info(f"DicomUploadView: Set PatientID to Django Patient Identifier: {dataset.PatientID}")
                else:
                    fallback_id = str(patient_instance.uuid).replace('-', '') if patient_instance else str(uuid.uuid4()).replace('-', '')[:8].upper()
                    dataset.PatientID = fallback_id
                    logger.warning(f"DicomUploadView: Using fallback PatientID: {dataset.PatientID}")
                
                if patient_instance and patient_instance.display_name:
                    patient_name_for_dicom = patient_instance.display_name.replace(' ', '^')
                else:
                    patient_name_for_dicom = f"UNKNOWN^PATIENT ({dataset.PatientID})"
                dataset.PatientName = patient_name_for_dicom
                logger.info(f"DicomUploadView: Set PatientName to: {dataset.PatientName}")

            except OpenMRSPatient.DoesNotExist:
                logger.warning(f"DicomUploadView: Patient not found in Django DB. Generating generic PatientID/Name.")
                if not hasattr(dataset, 'PatientID') or not dataset.PatientID:
                    dataset.PatientID = str(uuid.uuid4()).replace('-', '')[:8].upper()
                    logger.info(f"DicomUploadView: Generated generic PatientID: {dataset.PatientID}")
                if not hasattr(dataset, 'PatientName') or not dataset.PatientName:
                    dataset.PatientName = "GENERATED^PATIENT"
                    logger.info("DicomUploadView: Added generic PatientName.")

            logger.info("UID 길이 검사 및 필요한 경우 재 생성 시작")
            MAX_UID_LENGTH = 64

            try:
                if len(dataset.StudyInstanceUID) > MAX_UID_LENGTH:
                    logger.warning(f"기존 StudyInstanceUID가 너무 깁니다({len(dataset.StudyInstanceUID)}자). 새로 생성합니다.")
                    raise AttributeError("UID too long and needs replacement")
            except AttributeError:
                dataset.StudyInstanceUID = pydicom.uid.generate_uid()
                logger.info(f"새로운 StudyInstanceUID 생성: {dataset.StudyInstanceUID}")

            try:
                if len(dataset.SeriesInstanceUID) > MAX_UID_LENGTH:
                    logger.warning(f"기존 SeriesInstanceUID가 너무 깁니다({len(dataset.SeriesInstanceUID)}자). 새로 생성합니다.")
                    raise AttributeError("UID too long and needs replacement")
            except AttributeError:
                dataset.SeriesInstanceUID = pydicom.uid.generate_uid()
                logger.info(f"새로운 SeriesInstanceUID 생성: {dataset.SeriesInstanceUID}")
                
            dataset.SOPInstanceUID = pydicom.uid.generate_uid()
            logger.info(f"새로운 SOPInstanceUID 생성: {dataset.SOPInstanceUID}")

            now = datetime.now()
            if not hasattr(dataset, 'StudyDate'): dataset.StudyDate = now.strftime('%Y%m%d')
            if not hasattr(dataset, 'StudyTime'): dataset.StudyTime = now.strftime('%H%M%S.%f')[:-3]
            if not hasattr(dataset, 'Modality'): dataset.Modality = 'OT' # Other

            modified_dicom_stream = io.BytesIO()
            pydicom.dcmwrite(modified_dicom_stream, dataset, write_like_original=False)
            modified_dicom_bytes = modified_dicom_stream.getvalue()

            orthanc_url = f"{settings.ORTHANC_URL}/instances"
            response = requests.post(orthanc_url, data=modified_dicom_bytes, headers={'Content-Type': 'application/dicom'}, auth=ORTHANC_AUTH)
            response.raise_for_status()
            
            orthanc_patient_id = dataset.PatientID
            verify_url = f"{settings.ORTHANC_URL}/tools/find"
            verify_payload = {"Level": "Patient", "Query": {"PatientID": orthanc_patient_id}}
            verify_response = requests.post(verify_url, json=verify_payload, auth=ORTHANC_AUTH)
            
            if verify_response.status_code != 200 or not verify_response.json():
                logger.error(f"[FATAL] Orthanc에 PatientID '{orthanc_patient_id}' 저장 실패")
                return Response({
                    'error': 'PACS_ID_SAVE_FAILED',
                    'detail': 'DICOM 파일은 업로드되었지만 PatientID가 Orthanc에 저장되지 않았습니다.',
                    'orthanc_response': verify_response.text
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            try:
                if patient_instance:
                    patient_instance.pacs_id = orthanc_patient_id
                    patient_instance.save()
                    logger.info(f"DicomUploadView: Updated patient PACS ID to: {orthanc_patient_id}")
            except Exception as update_error:
                logger.exception(f"DicomUploadView: 환자 정보 업데이트 실패")

            return Response(response.json(), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.exception("DicomUploadView: 업로드 중 치명적 오류")
            return Response({
                'error': 'UPLOAD_FAILED',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PatientStudiesView(APIView):
    """
    특정 환자의 DICOM studies 조회 API - 기존 로직을 유지하며 Series 정보 조회를 추가합니다.
    """
    def get(self, request, patient_pacs_id, format=None):
        logger.info(f"PatientStudiesView: GET 요청 수신 - patient_pacs_id: {patient_pacs_id}")
        
        if not patient_pacs_id:
            return Response({'error': '환자 PACS ID가 필요합니다'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            orthanc_find_url = f"{settings.ORTHANC_URL}/tools/find"
            find_patient_payload = {
                "Level": "Patient",
                "Query": {"PatientID": patient_pacs_id}
            }
            find_patient_response = requests.post(orthanc_find_url, json=find_patient_payload, auth=ORTHANC_AUTH, timeout=10)
            find_patient_response.raise_for_status()
            patient_orthanc_ids = find_patient_response.json()

            if not patient_orthanc_ids:
                logger.warning(f"PACS에서 환자 ID '{patient_pacs_id}'를 찾을 수 없습니다.")
                return Response({'studies': [], 'message': '환자를 PACS에서 찾을 수 없습니다'}, status=status.HTTP_200_OK)

            find_studies_payload = {
                "Level": "Study",
                "Query": {"PatientID": patient_pacs_id}
            }
            find_studies_response = requests.post(orthanc_find_url, json=find_studies_payload, auth=ORTHANC_AUTH, timeout=10)
            find_studies_response.raise_for_status()
            study_orthanc_ids = find_studies_response.json()

            if not study_orthanc_ids:
                logger.info(f'환자 "{patient_pacs_id}"의 영상 데이터가 없습니다.')
                return Response({'studies': [], 'message': f'환자 "{patient_pacs_id}"의 영상 데이터가 없습니다'}, status=status.HTTP_200_OK)

            studies_data_to_return = []
            for study_id in study_orthanc_ids:
                try:
                    study_url = f"{settings.ORTHANC_URL}/studies/{study_id}"
                    study_response = requests.get(study_url, auth=ORTHANC_AUTH, timeout=10)
                    study_response.raise_for_status()
                    study_data = study_response.json()

                    series_list = []
                    series_url = f"{settings.ORTHANC_URL}/studies/{study_id}/series"
                    series_response = requests.get(series_url, auth=ORTHANC_AUTH, timeout=10)
                    if series_response.status_code == 200:
                        series_list = series_response.json()
                        for series in series_list:
                            series_detail_url = f"{settings.ORTHANC_URL}/series/{series['ID']}"
                            series_detail_response = requests.get(series_detail_url, auth=ORTHANC_AUTH, timeout=10)
                            if series_detail_response.status_code == 200:
                                series.update(series_detail_response.json())

                    study_data['Series'] = series_list
                    
                    public_orthanc_url = settings.ORTHANC_PUBLIC_URL
                    if public_orthanc_url:
                        study_data['viewer_url'] = f"{public_orthanc_url}/app/explorer.html#study?uuid={study_id}"

                    studies_data_to_return.append(study_data)
                    
                except Exception as study_error:
                    logger.warning(f"PatientStudiesView: Study {study_id} 처리 중 오류 발생 - {study_error}")
                    continue

            return Response({"studies": studies_data_to_return}, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            logger.error(f"PatientStudiesView: Orthanc 통신 오류 - {e}")
            return Response({'error': 'ORTHANC_CONNECTION_ERROR', 'detail': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
        except Exception as e:
            logger.exception("PatientStudiesView: 예상치 못한 오류 발생")
            return Response({'error': 'INTERNAL_ERROR', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            
class VerifyPacsIdView(APIView):
    """PACS ID 존재 여부 확인 API (상세 디버깅 버전)"""
    def get(self, request, pacs_id, format=None):
        logger.info(f"[VERIFY] PACS ID 검증 시작: {pacs_id}")
        
        debug_info = {
            'request_pacs_id': pacs_id,
            'pacs_id_length': len(pacs_id),
            'contains_hyphens': '-' in pacs_id,
            'orthanc_url': settings.ORTHANC_URL,
            'orthanc_public_url': settings.ORTHANC_PUBLIC_URL,
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            # 1. Orthanc 서버 연결 상태 확인
            ping_url = f"{settings.ORTHANC_URL}/system"
            logger.info(f"[VERIFY] Orthanc 서버 연결 확인: {ping_url}")
            
            ping_response = requests.get(ping_url, auth=ORTHANC_AUTH, timeout=10)
            if ping_response.status_code != 200:
                logger.error(f"[VERIFY] Orthanc 서버 연결 실패: {ping_response.status_code}")
                return Response({
                    'error': 'ORTHANC_CONNECTION_FAILED',
                    'detail': f'Orthanc 서버 응답 오류: {ping_response.status_code}',
                    'debug_info': debug_info
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            orthanc_system_info = ping_response.json()
            debug_info['orthanc_system'] = orthanc_system_info
            logger.info(f"[VERIFY] Orthanc 시스템 정보: {orthanc_system_info}")
            
            # 2. 전체 환자 목록 확인
            all_patients_url = f"{settings.ORTHANC_URL}/patients"
            all_patients_response = requests.get(all_patients_url, auth=ORTHANC_AUTH, timeout=10)
            all_patients = all_patients_response.json()
            debug_info['total_patients_in_orthanc'] = len(all_patients)
            logger.info(f"[VERIFY] Orthanc 전체 환자 수: {len(all_patients)}")
            
            # 3. 정확한 PatientID 검색
            orthanc_search_url = f"{settings.ORTHANC_URL}/tools/find"
            payload = {
                "Level": "Patient",
                "Query": {"PatientID": pacs_id}
            }
            
            logger.info(f"[VERIFY] 검색 요청: {orthanc_search_url}")
            logger.info(f"[VERIFY] 검색 페이로드: {payload}")
            
            search_response = requests.post(
                orthanc_search_url, 
                json=payload, 
                auth=ORTHANC_AUTH,
                timeout=10
            )
            search_response.raise_for_status()
            
            found_patients = search_response.json(); # 이 부분에서 response가 [] 일수도, [{ID: '...', Type: 'Patient'}] 일수도 있음
            exists = len(found_patients) > 0
            
            debug_info.update({
                'search_payload': payload,
                'search_response_status': search_response.status_code,
                'found_patients_count': len(found_patients),
                'found_patients_ids': found_patients
            })
            
            logger.info(f"[VERIFY] 검색 결과: {len(found_patients)}개 환자 발견")
            
            # 4. 유사한 PatientID 검색 (하이픈 제거 버전)
            if not exists and '-' in pacs_id:
                cleaned_pacs_id = pacs_id.replace('-', '')
                cleaned_payload = {
                    "Level": "Patient",
                    "Query": {"PatientID": cleaned_pacs_id}
                }
                
                logger.info(f"[VERIFY] 하이픈 제거 후 재검색: {cleaned_pacs_id}")
                cleaned_search_response = requests.post(
                    orthanc_search_url, 
                    json=cleaned_payload, 
                    auth=ORTHANC_AUTH,
                    timeout=10
                )
                cleaned_found_patients = cleaned_search_response.json()
                
                debug_info['cleaned_search'] = {
                    'cleaned_pacs_id': cleaned_pacs_id,
                    'found_patients_count': len(cleaned_found_patients),
                    'found_patients_ids': cleaned_found_patients
                }
            
            # 5. OpenMRS 환자 정보 확인
            try:
                openmrs_patient = OpenMRSPatient.objects.filter(
                    uuid=pacs_id
                ).first()
                if openmrs_patient:
                    debug_info['openmrs_patient'] = {
                        'uuid': str(openmrs_patient.uuid),
                        'identifier': openmrs_patient.identifier,
                        'display_name': openmrs_patient.display_name,
                        'pacs_id': openmrs_patient.pacs_id
                    }
                else:
                    # identifier로도 검색
                    openmrs_patient_by_id = OpenMRSPatient.objects.filter(
                        identifier=pacs_id
                    ).first()
                    if openmrs_patient_by_id:
                        debug_info['openmrs_patient'] = {
                            'found_by': 'identifier',
                            'uuid': str(openmrs_patient_by_id.uuid),
                            'identifier': openmrs_patient_by_id.identifier,
                            'display_name': openmrs_patient_by_id.display_name,
                            'pacs_id': openmrs_patient_by_id.pacs_id
                        }
            except Exception as openmrs_error:
                debug_info['openmrs_error'] = str(openmrs_error)
                logger.warning(f"[VERIFY] OpenMRS 환자 조회 실패: {openmrs_error}")
            
            return Response({
                'pacs_id': pacs_id,
                'exists_in_pacs': exists,
                'orthanc_response': found_patients,
                'debug_info': debug_info,
                'recommendations': self._get_recommendations(debug_info, exists)
            }, status=status.HTTP_200_OK)
            
        except requests.exceptions.ConnectionError as e:
            logger.error(f"[VERIFY] Orthanc 연결 오류: {e}")
            return Response({
                'error': 'ORTHANC_CONNECTION_ERROR',
                'detail': f'Orthanc 서버에 연결할 수 없습니다: {str(e)}',
                'debug_info': debug_info
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
        except requests.exceptions.Timeout as e:
            logger.error(f"[VERIFY] Orthanc 응답 시간 초과: {e}")
            return Response({
                'error': 'ORTHANC_TIMEOUT',
                'detail': f'Orthanc 서버 응답 시간이 초과되었습니다: {str(e)}',
                'debug_info': debug_info
            }, status=status.HTTP_504_GATEWAY_TIMEOUT)
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"[VERIFY] Orthanc HTTP 오류: {e.response.status_code} - {e.response.text}")
            return Response({
                'error': 'ORTHANC_HTTP_ERROR',
                'detail': f'Orthanc HTTP 오류: {e.response.status_code}',
                'orthanc_response': e.response.text,
                'debug_info': debug_info
            }, status=e.response.status_code)
            
        except Exception as e:
            logger.exception(f"[VERIFY] 예상치 못한 오류 발생")
            return Response({
                'error': 'VERIFICATION_FAILED',
                'detail': str(e),
                'error_type': type(e).__name__,
                'debug_info': debug_info
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_recommendations(self, debug_info, exists):
        """디버깅 정보를 바탕으로 해결 방안 제시"""
        recommendations = []
        
        if not exists:
            recommendations.append("PACS ID가 Orthanc에 존재하지 않습니다.")
            
            if debug_info.get('contains_hyphens'):
                recommendations.append("하이픈이 포함된 UUID입니다. 하이픈을 제거한 형태로 DICOM PatientID가 저장되었는지 확인하세요.")
            
            if debug_info.get('total_patients_in_orthanc', 0) == 0:
                recommendations.append("Orthanc에 환자 데이터가 전혀 없습니다. DICOM 파일이 정상적으로 업로드되었는지 확인하세요.")
            
            if 'openmrs_patient' not in debug_info:
                recommendations.append("OpenMRS에서 해당 환자를 찾을 수 없습니다. 환자 등록 상태를 확인하세요.")
            else:
                openmrs_data = debug_info['openmrs_patient']
                if openmrs_data.get('identifier'):
                    recommendations.append(f"OpenMRS 환자의 identifier는 '{openmrs_data['identifier']}'입니다. 이 값으로 DICOM이 업로드되었는지 확인하세요.")
        
        return recommendations


# 새롭게 추가된 DICOM 인스턴스 데이터 스트리밍 함수
def get_dicom_instance_data(request, instance_id):
    """
    Orthanc로부터 특정 DICOM 인스턴스 파일의 바이너리 데이터를 직접 가져와 스트리밍합니다.
    """
    logger.info(f"get_dicom_instance_data: 요청 수신 - instance_id: {instance_id}")

    orthanc_url = settings.ORTHANC_URL
    orthanc_auth = (settings.ORTHANC_USERNAME, settings.ORTHANC_PASSWORD)

    # Orthanc에서 특정 인스턴스의 바이너리 데이터를 가져오는 API 엔드포인트
    # Orthanc REST API 문서: /instances/{id}/file
    orthanc_instance_file_url = f"{orthanc_url}/instances/{instance_id}/file"

    try:
        response = requests.get(orthanc_instance_file_url, auth=orthanc_auth, stream=True, timeout=30)
        response.raise_for_status() # HTTP 오류가 발생하면 예외 발생 (4xx, 5xx)

        # 응답 헤더 설정: CornerstoneJS가 DICOM 파일임을 인식하도록 Content-Type 설정이 중요
        # 또한, Content-Disposition을 설정하여 파일 다운로드 시 파일 이름을 지정할 수 있음
        response_headers = {
            'Content-Type': 'application/dicom', # 표준 DICOM MIME 타입
            'Content-Disposition': f'attachment; filename="{instance_id}.dcm"'
        }

        # Orthanc로부터 받은 바이너리 데이터를 클라이언트에 스트리밍
        # chunk_size를 사용하여 대용량 파일도 효율적으로 처리
        logger.info(f"get_dicom_instance_data: Orthanc에서 인스턴스 {instance_id} 데이터 스트리밍 시작. Status: {response.status_code}")
        return HttpResponse(response.iter_content(chunk_size=8192), headers=response_headers, status=response.status_code)

    except requests.exceptions.RequestException as e:
        logger.error(f"get_dicom_instance_data: Orthanc 통신 오류 또는 파일 가져오기 실패 - Instance ID: {instance_id}, Error: {e}")
        # DRF Response 대신 Django의 JsonResponse를 사용하여 일관성 유지 (선택 사항)
        return JsonResponse({"error": f"PACS에서 DICOM 파일을 가져오는 데 실패했습니다: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.exception(f"get_dicom_instance_data: 예상치 못한 오류 발생 - Instance ID: {instance_id}")
        return JsonResponse({"error": f"내부 서버 오류: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SeriesInstancesView(APIView):
    """특정 시리즈의 모든 인스턴스 정보를 조회하여 Cornerstone.js가 사용할 imageIds 목록을 반환"""
    def get(self, request, study_instance_uid, series_instance_uid, format=None):
        logger.info(f"SeriesInstancesView: GET 요청 수신 - Study: {study_instance_uid}, Series: {series_instance_uid}")
        
        try:
            # Orthanc의 REST API를 사용하여 시리즈 내의 모든 인스턴스 ID 목록을 가져옵니다.
            # 이 'instance_id'는 Orthanc 내부에서 사용하는 UUID입니다.
            instances_url = f"{settings.ORTHANC_URL}/series/{series_instance_uid}/instances" 
            instances_response = requests.get(instances_url, auth=ORTHANC_AUTH, timeout=20)
            instances_response.raise_for_status()
            instances_list_from_orthanc = instances_response.json() # This list contains Orthanc's internal instance UUIDs

            if not instances_list_from_orthanc:
                return Response({"error": "해당 시리즈에 인스턴스가 없습니다."}, status=status.HTTP_404_NOT_FOUND)

            image_ids = []
            
            # 받아온 Orthanc 인스턴스 ID 목록을 순회합니다.
            for orthanc_instance_id in instances_list_from_orthanc:
                # Orthanc의 /series/{series_uid}/instances API가 반환하는 것이
                # 인스턴스 UUID 문자열들의 배열인지, 아니면 {ID: '...', Type: 'Instance'}와 같은 객체 배열인지 확인이 필요합니다.
                # 로그에 따르면 객체 배열일 가능성이 높습니다. 따라서 orthanc_instance_id에서 'ID' 속성을 추출해야 합니다.
                instance_uuid = orthanc_instance_id # 기본적으로는 문자열이라고 가정
                
                # ★★★ 이 조건문을 추가하여 orthanc_instance_id가 딕셔너리일 경우 'ID' 값을 추출합니다. ★★★
                if isinstance(orthanc_instance_id, dict) and 'ID' in orthanc_instance_id:
                    instance_uuid = orthanc_instance_id['ID']
                
                # 이 instance_uuid는 get_dicom_instance_data의 {instance_id}에 정확히 매핑되어야 합니다.
                dicom_data_proxy_url = request.build_absolute_uri(
                    f'/api/pacs/dicom-instance-data/{instance_uuid}/'
                )
                
                # Cornerstone.js는 'wadouri:' 프리픽스를 통해 워커를 사용하여 이미지를 로드합니다.
                wadouri_url = f"wadouri:{dicom_data_proxy_url}"
                image_ids.append(wadouri_url)
                logger.debug(f"SeriesInstancesView: Generated imageId: {wadouri_url}")

            if not image_ids:
                return Response({"error": "유효한 인스턴스를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

            logger.info(f"SeriesInstancesView: {len(image_ids)}개의 imageIds 반환")
            return Response(image_ids, status=status.HTTP_200_OK)

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                logger.warning(f"SeriesInstancesView: Orthanc에서 Study/Series '{study_instance_uid}/{series_instance_uid}'를 찾을 수 없습니다.")
                return Response({"error": "Orthanc에서 해당 Study/Series를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
            logger.error(f"SeriesInstancesView: Orthanc HTTP 오류: {e.response.status_code} - {e.response.text}")
            return Response({"error": f"Orthanc 오류: {e.response.text}"}, status=e.response.status_code)
        except Exception as e:
            logger.exception("SeriesInstancesView: 예상치 못한 오류")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 유정우넌할수있어 여러개 파일 동시에 올리는거 구현중
class NiftiUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        patient_uuid = request.data.get('patient_uuid')
        files = request.FILES.getlist('files')
        modalities = request.data.getlist('modalities')

        # --- 필드 유효성 검사 ---
        if not patient_uuid:
            return Response({"detail": "patient_uuid가 필요합니다."}, status=400)
        if not files or not modalities:
            return Response({"detail": "files와 modalities를 함께 보내야 합니다."}, status=400)
        if len(files) != len(modalities):
            return Response({"detail": "files와 modalities 개수가 다릅니다."}, status=400)
        if len(files) > 3:
            return Response({"detail": "최대 3개까지 업로드 가능합니다."}, status=400)

        # --- 환자 검증 ---
        try:
            # 실제 사용하는 OpenMRSPatient 모델로 변경해야 합니다.
            patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        except Http404:
            return Response({"detail": "해당 UUID의 환자를 찾을 수 없습니다."}, status=404)

        # --- 부족한 모달리티에 대해 더미 파일 처리 준비 ---
        # 예: modalities=['FLAIR','DWI'] -> files, modalities 리스트에 ADC에 대한 항목 추가
        all_modalities = ['FLAIR', 'DWI', 'ADC']
        current_modalities = {mod: file for mod, file in zip(modalities, files)}
        
        processed_files = []
        processed_modalities = []

        for mod in all_modalities:
            processed_modalities.append(mod)
            processed_files.append(current_modalities.get(mod)) # 해당 모달리티가 없으면 None이 추가됨

        # --- 처리 결과 저장할 리스트 ---
        result = []

        # --- 각 파일/모달리티마다 처리 ---
        for nifti_file, modality in zip(processed_files, processed_modalities):
            # 파일이 None이면 더미 데이터로 처리
            if nifti_file is None:
                # TODO: 더미 NIfTI 생성 또는 스킵 로직 구현
                result.append({'modality': modality, 'status': 'dummy_generated'})
                continue

            # --- 실제 파일 처리: 임시 저장 → GCS 업로드 → DICOM 변환 → Orthanc 업로드 ---
            tmp_path = None # finally 블록에서 사용하기 위해 초기화
            try:
                # 1) 임시 파일에 NIfTI 저장
                with tempfile.NamedTemporaryFile(delete=False, suffix='.nii') as tmp:
                    tmp_path = tmp.name
                    for chunk in nifti_file.chunks():
                        tmp.write(chunk)

                # 2) Google Cloud Storage에 업로드
                storage_client = storage.Client()
                bucket = storage_client.bucket(settings.GCS_BUCKET_NAME)
                # timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                # blob_name = f"nifti/{patient_uuid}/{modality}/{timestamp}_{os.path.basename(nifti_file.name)}"
                # ── 세션 폴더 이름 (예: "20250625_1704") ──
                session_folder = datetime.now().strftime('%Y%m%d_%H%M')

                # GCS 경로: nifti/{patient_uuid}/{session_folder}/{modality}/파일명
                blob_name = (
                    f"nifti/{patient_uuid}/"
                    f"{session_folder}/"
                    f"{modality}/"
                    f"{os.path.basename(nifti_file.name)}"
                )                
                bucket.blob(blob_name).upload_from_filename(tmp_path)

                uploaded_blobs[modality.lower()] = f"gs://{settings.GCS_BUCKET_NAME}/{blob_name}"

                # 3) NIfTI 파일을 DICOM으로 변환 및 Orthanc 업로드
                img = nib.load(tmp_path).get_fdata()
                study_uid = pydicom.uid.generate_uid()
                series_uid = pydicom.uid.generate_uid()

                for i in range(img.shape[2]):
                    slice_data = (img[:, :, i] * 255).astype('uint16')

                    # File Meta 생성
                    file_meta = FileMetaDataset()
                    file_meta.MediaStorageSOPClassUID    = '1.2.840.10008.5.1.4.1.1.2' # CT Image Storage
                    file_meta.MediaStorageSOPInstanceUID = generate_uid()
                    file_meta.TransferSyntaxUID          = ExplicitVRLittleEndian
                    file_meta.ImplementationClassUID     = generate_uid()

                    # FileDataset 생성
                    ds = FileDataset("", {}, file_meta=file_meta, preamble=b"\0" * 128)

                    # 필수 DICOM 태그 채우기
                    ds.PatientID                 = patient.identifier
                    ds.PatientName               = patient.display_name
                    ds.Modality                  = modality
                    ds.StudyInstanceUID          = study_uid
                    ds.SeriesInstanceUID         = series_uid
                    ds.SOPClassUID               = file_meta.MediaStorageSOPClassUID
                    ds.SOPInstanceUID            = file_meta.MediaStorageSOPInstanceUID
                    
                    ds.Rows, ds.Columns          = slice_data.shape
                    ds.SamplesPerPixel           = 1
                    ds.PhotometricInterpretation = "MONOCHROME2"
                    ds.PixelRepresentation       = 0
                    ds.BitsAllocated             = 16
                    ds.BitsStored                = 16
                    ds.HighBit                   = 15
                    ds.PixelData                 = slice_data.tobytes()

                    ds.is_little_endian          = True
                    ds.is_implicit_VR            = False
                    
                    # 4) 생성된 DICOM 슬라이스를 Orthanc에 업로드
                    with tempfile.NamedTemporaryFile(suffix='.dcm') as dcm_tmp:
                        ds.save_as(dcm_tmp.name, write_like_original=False)
                        with open(dcm_tmp.name, 'rb') as fp:
                            dicom_bytes = fp.read()

                    resp = requests.post(
                        f"{settings.ORTHANC_URL}/instances",
                        data=dicom_bytes,
                        auth=(settings.ORTHANC_USERNAME, settings.ORTHANC_PASSWORD),
                        headers={'Content-Type': 'application/dicom'}
                    )
                    resp.raise_for_status()

                result.append({'modality': modality, 'status': 'uploaded'})

            except Exception as e:
                result.append({'modality': modality, 'status': 'error', 'error': str(e)})
            
            finally:
                # 임시 파일 삭제
                if tmp_path and os.path.exists(tmp_path):
                    os.remove(tmp_path)

        return Response({'results': result}, status=201)


# ####### 유정우넌할수있어 nnunet성공이후 추가 ###########
# class ListPatientSessionsView(APIView):
#     def get(self, request, patient_uuid, *args, **kwargs):
#         logger.info(f"GCS 파일 목록 조회 시작. 환자 UUID: {patient_uuid}")
#         try:
#             storage_client = storage.Client()
#             bucket = storage_client.bucket("final_model_data1")
#             prefix = f"nifti/{patient_uuid}/"
#             blobs = list(bucket.list_blobs(prefix=prefix))
            
#             if not blobs:
#                 return Response({"sessions": []})

#             sessions_data = defaultdict(lambda: defaultdict(list))
#             for blob in blobs:
#                 parts = blob.name.split('/')
#                 if len(parts) >= 5 and parts[-1]:
#                     session_id, modality, file_name = parts[2], parts[3], parts[4]
#                     sessions_data[session_id][modality.lower()].append({
#                         "name": file_name,
#                         "gcs_path": f"gs://{bucket.name}/{blob.name}",
#                     })
            
#             if not sessions_data: return Response({"sessions": []})

#             formatted_sessions = [{"sessionId": sid, "modalities": mods} for sid, mods in sessions_data.items()]
#             sorted_sessions = sorted(formatted_sessions, key=lambda s: s['sessionId'], reverse=True)
#             return Response({"sessions": sorted_sessions})
#         except Exception as e:
#             logger.error(f"GCS 파일 목록 조회 중 오류: {e}", exc_info=True)
#             return Response({"error": "서버 오류"}, status=500)

class ListPatientSessionsView(APIView):
    def get(self, request, patient_uuid, *args, **kwargs):
        logger.info(f"GCS 파일 목록 조회 시작. 환자 UUID: {patient_uuid}")
        try:
            storage_client = storage.Client()
            # 💡 버킷 이름을 settings에서 가져오거나 하드코딩된 값으로 수정하세요.
            bucket = storage_client.bucket("final_model_data1") 
            prefix = f"nifti/{patient_uuid}/"
            blobs = list(bucket.list_blobs(prefix=prefix))
            
            if not blobs:
                return Response({"sessions": []})

            sessions_data = defaultdict(lambda: defaultdict(list))
            for blob in blobs:
                # ✨ 임시 파일을 생성하고 삭제하기 위한 변수 초기화
                temp_file_path = None
                try:
                    parts = blob.name.split('/')
                    if len(parts) >= 5 and parts[-1]:
                        session_id, modality, file_name = parts[2], parts[3], parts[4]
                        
                        metadata = {}
                        try:
                            # 1. 고유한 이름을 가진 임시 파일을 생성합니다.
                            with tempfile.NamedTemporaryFile(delete=False, suffix=".nii.gz") as tmp_file:
                                temp_file_path = tmp_file.name
                            
                            # 2. GCS의 파일을 이 임시 파일로 다운로드합니다.
                            blob.download_to_filename(temp_file_path)
                            
                            # 3. 이제 파일 '경로'를 사용하므로 nib.load가 확실하게 동작합니다.
                            nifti_img = nib.load(temp_file_path)
                            
                            shape = nifti_img.shape
                            zooms = nifti_img.header.get_zooms()
                            
                            metadata = {
                                "resolution": f"{shape[0]}x{shape[1]}",
                                "sliceThickness": float(f"{zooms[2]:.2f}")
                            }
                        except Exception as meta_error:
                            logger.warning(f"메타데이터 추출 실패 ({blob.name}): {meta_error}")
                            metadata = {}

                        sessions_data[session_id][modality.lower()].append({
                            "name": file_name,
                            "gcs_path": f"gs://{bucket.name}/{blob.name}",
                            "metadata": metadata
                        })
                except Exception as e:
                    logger.error(f"세션 처리 중 오류 ({blob.name}): {e}")
                    continue
                finally:
                    # 4. try-except 로직이 끝나면 항상 임시 파일을 삭제하여 서버에 쓰레기 파일이 남지 않도록 합니다.
                    if temp_file_path and os.path.exists(temp_file_path):
                        os.remove(temp_file_path)

            if not sessions_data: 
                return Response({"sessions": []})

            formatted_sessions = [{"sessionId": sid, "modalities": mods} for sid, mods in sessions_data.items()]
            sorted_sessions = sorted(formatted_sessions, key=lambda s: s['sessionId'], reverse=True)
            return Response({"sessions": sorted_sessions})
            
        except Exception as e:
            logger.error(f"GCS 파일 목록 조회 중 오류: {e}", exc_info=True)
            return Response({"error": "서버 오류"}, status=500)

class DicomConverterMixin:
    def convert_nifti_to_dicom(self, gcs_path, patient, study_uid, image_type, request):
        logger.info(f"DICOM 변환 시작 ({image_type}): {gcs_path}")
        safe_temp_dir = os.path.join(settings.BASE_DIR, 'temp_files')
        os.makedirs(safe_temp_dir, exist_ok=True)
        temp_nifti_path = os.path.join(safe_temp_dir, f"{uuid.uuid4()}.nii.gz")
        temp_dicom_dir = tempfile.mkdtemp(dir=safe_temp_dir)
        
        try:
            storage_client = storage.Client()
            bucket_name, blob_name = gcs_path.replace("gs://", "").split("/", 1)
            bucket = storage_client.bucket(bucket_name)
            bucket.blob(blob_name).download_to_filename(temp_nifti_path)
            
            nifti_img = nib.load(temp_nifti_path)
            img_data = nifti_img.get_fdata()

            if image_type.upper() == 'SEG':
                # 마스크는 0/1 or 0/255로 강제 변환 (픽셀 오버레이 선명하게!)
                    img_data = (img_data <= 0.5).astype(np.uint8) * 255   # ★★★ 반전!
                    window_center, window_width = 128, 255
                    real_min, real_max = 0, 255
                    int_max, int_min = 255, 0
                    rescale_slope = 1
                    rescale_intercept = 0
                    bits_allocated = 8
                    bits_stored = 8
                    high_bit = 7
            else:
                window_center, window_width = 115.0, 4186.0
                real_min, real_max = np.min(img_data), np.max(img_data)
                int_max, int_min = np.iinfo(np.int16).max, np.iinfo(np.int16).min
                rescale_slope = (real_max - real_min) / (int_max - int_min) if real_max != real_min else 1.0
                rescale_intercept = real_min

            series_uid = generate_uid()
            orthanc_ids = []

            for i in range(img_data.shape[2]):
                slice_float = img_data[:, :, i]
                scaled_slice = ((slice_float - rescale_intercept) / rescale_slope) + int_min if rescale_slope != 0 else np.zeros_like(slice_float)
                pixel_data, pixel_repr = scaled_slice.astype(np.int16), 1

                rotated_data = np.rot90(pixel_data, k=3)
                ds = FileDataset(None, {}, file_meta=FileMetaDataset(), preamble=b"\0" * 128)
                ds.file_meta.MediaStorageSOPClassUID = pydicom.uid.MRImageStorage
                ds.file_meta.MediaStorageSOPInstanceUID = generate_uid()
                ds.file_meta.TransferSyntaxUID = pydicom.uid.ExplicitVRLittleEndian
                ds.PatientID, ds.PatientName = patient.identifier, patient.display_name.replace(' ', '^')
                ds.StudyInstanceUID, ds.SeriesInstanceUID = study_uid, series_uid
                ds.SOPInstanceUID, ds.SOPClassUID = ds.file_meta.MediaStorageSOPInstanceUID, ds.file_meta.MediaStorageSOPClassUID
                ds.Modality, ds.InstanceNumber, ds.ImageType = "MR", str(i + 1), ["DERIVED", "PRIMARY"]
                ds.StudyDate, ds.StudyTime = datetime.now().strftime('%Y%m%d'), datetime.now().strftime('%H%M%S')
                pix_zooms = nifti_img.header.get_zooms()[:2]
                ds.PixelSpacing = [f"{z:.8f}" for z in reversed(pix_zooms)]
                ds.Rows, ds.Columns = rotated_data.shape
                ds.SamplesPerPixel = 1
                ds.PhotometricInterpretation = "MONOCHROME2"
                ds.BitsAllocated, ds.BitsStored, ds.HighBit = 16, 16, 15
                ds.PixelRepresentation = pixel_repr
                ds.PixelData = rotated_data.tobytes()
                ds.RescaleIntercept, ds.RescaleSlope = f"{rescale_intercept:.8f}", f"{rescale_slope:.8f}"
                ds.WindowCenter, ds.WindowWidth = f"{window_center:.8f}", f"{window_width:.8f}"
                temp_dcm_path = os.path.join(temp_dicom_dir, f"slice_{i}.dcm")
                ds.save_as(temp_dcm_path, write_like_original=False)
                with open(temp_dcm_path, 'rb') as f:
                    resp = requests.post(f"{settings.ORTHANC_URL}/instances", data=f.read(), auth=ORTHANC_AUTH)
                    resp.raise_for_status()
                    orthanc_ids.append(resp.json()['ID'])
            
            image_ids = [f"wadouri:{request.build_absolute_uri(f'/api/pacs/dicom-instance-data/{_id}/')}" for _id in orthanc_ids]
            return {"seriesInstanceUID": series_uid, "imageIds": image_ids}

        except Exception as e:
            logger.error(f"DICOM 변환 중 오류 ({gcs_path}): {e}", exc_info=True)
            return None
        finally:
            if 'temp_nifti_path' in locals() and os.path.exists(temp_nifti_path): os.remove(temp_nifti_path)
            if 'temp_dicom_dir' in locals() and os.path.exists(temp_dicom_dir): shutil.rmtree(temp_dicom_dir)


class NiftiToDicomView(APIView, DicomConverterMixin):
    def post(self, request, *args, **kwargs):
        gcs_path = request.data.get('gcs_path'); patient_uuid = request.data.get('patient_uuid')
        image_type = request.data.get('image_type', 'unknown')
        if not gcs_path or not patient_uuid: return Response({"error": "gcs_path, patient_uuid 필요"}, status=400)
        
        try:
            # patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
            class TempPatient: identifier = patient_uuid; display_name = "Unknown^Patient"
            patient = TempPatient()
        except (ImportError, Http404):
            class TempPatient: identifier = patient_uuid; display_name = "Unknown^Patient"
            patient = TempPatient()

        result = self.convert_nifti_to_dicom(gcs_path, patient, generate_uid(), image_type, request)
        if result: return Response(result)
        return Response({"error": "DICOM 변환 서버 오류"}, status=500)


class NiftiToDicomBundleView(APIView, DicomConverterMixin, SegDicomConverterMixin):
    def post(self, request, *args, **kwargs):
        image_requests = request.data.get('images', [])
        patient_uuid = request.data.get('patient_uuid')
        if not image_requests or not patient_uuid:
            return Response({"error": "images, patient_uuid 필요"}, status=400)
        try:
            # patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
            class TempPatient: identifier = patient_uuid; display_name = "Unknown^Patient"
            patient = TempPatient()
        except (ImportError, Http404):
            class TempPatient: identifier = patient_uuid; display_name = "Unknown^Patient"
            patient = TempPatient()

        results, study_uid = {}, generate_uid()
        for req in image_requests:
            image_type, gcs_path = req.get('type'), req.get('gcs_path')
            if image_type and gcs_path:
                # 이제 SEG도 일반 DICOM 시리즈로 변환
                series_result = self.convert_nifti_to_dicom(
                    gcs_path, patient, study_uid, image_type, request
                )
                if series_result:
                    results[image_type] = series_result
        # for req in image_requests:
        #     image_type, gcs_path = req.get('type'), req.get('gcs_path')
        #     if image_type and gcs_path:
        #         if image_type.upper() == "SEG":
        #             series_result = self.convert_nifti_to_dicom_seg(
        #                 gcs_path, patient, study_uid, request
        #             )
        #         else:
        #             series_result = self.convert_nifti_to_dicom(
        #                 gcs_path, patient, study_uid, image_type, request
        #             )
        #         if series_result:
        #             results[image_type] = series_result

        return Response(results)


class DicomInstanceDataView(APIView):
    authentication_classes, permission_classes = [], []
    def get(self, request, instance_id, *args, **kwargs):
        orthanc_url = f"{settings.ORTHANC_URL}/instances/{instance_id}/file"
        try:
            response = requests.get(orthanc_url, auth=ORTHANC_AUTH, stream=True)
            response.raise_for_status()
            return HttpResponse(response.content, content_type=response.headers['Content-Type'])
        except requests.exceptions.RequestException as e:
            logger.error(f"Orthanc 인스턴스({instance_id}) GET 오류: {e}")
            return Response({"error": "Orthanc 서버 데이터 GET 실패"}, status=502)


class FileDeleteAPIView(APIView):
    """
    GCS에 있는 파일을 삭제하는 API
    """
    def delete(self, request, *args, **kwargs):
        # 1. 리모컨(프론트엔드)에서 보낸 gcs_path 정보를 꺼냅니다.
        gcs_path = request.data.get('gcs_path')

        if not gcs_path:
            return Response(
                {"error": "삭제할 파일의 gcs_path가 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 2. GCS 경로를 '버킷 이름'과 '파일 이름(blob_name)'으로 분리합니다.
            if not gcs_path.startswith("gs://"):
                raise ValueError("올바르지 않은 GCS 경로 형식입니다.")
            
            parts = gcs_path.replace("gs://", "").split("/", 1)
            bucket_name = parts[0]
            blob_name = parts[1]

            # 3. [핵심] GCS에 접속하여 실제 파일을 삭제하는 로직
            # TODO: 이 부분은 실제 GCS 프로젝트 설정에 맞는 인증 과정이 필요할 수 있습니다.
            storage_client = storage.Client()
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(blob_name)

            if not blob.exists():
                return Response(
                    {"error": "GCS에서 해당 파일을 찾을 수 없습니다."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # 실제 파일 삭제 명령
            blob.delete()

            print(f"파일 삭제 성공: {gcs_path}")

            # 4. 성공적으로 임무를 마쳤음을 알립니다.
            return Response(
                {"message": f"파일 '{blob_name}'이(가) 성공적으로 삭제되었습니다."},
                status=status.HTTP_204_NO_CONTENT # 성공 시에는 보통 내용 없이 상태 코드만 보냅니다.
            )

        except Exception as e:
            # 5. 임무 수행 중 문제가 생기면 오류를 보고합니다.
            print(f"GCS 파일 삭제 중 오류 발생: {e}")
            return Response(
                {"error": "서버에서 파일 삭제 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SessionDeleteAPIView(APIView):
    """
    특정 세션에 속한 모든 GCS 파일을 삭제하는 API
    """
    def delete(self, request, *args, **kwargs):
        # 1. 리모컨에서 보낸 patient_id와 session_id 정보를 꺼냅니다.
        patient_id = request.data.get('patient_id')
        session_id = request.data.get('session_id')

        if not patient_id or not session_id:
            return Response(
                {"error": "patient_id와 session_id가 모두 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 2. 삭제할 폴더 경로를 만듭니다. (예: "nifti/환자ID/세션ID/")
            # TODO: 이 부분은 실제 GCS 폴더 구조에 맞게 수정해야 할 수 있습니다.
            # 예시에서는 'nifti/' 로 시작한다고 가정합니다.
            folder_prefix = f"nifti/{patient_id}/{session_id}/"

            # 3. [핵심] GCS에 접속하여 해당 폴더 안의 모든 파일을 찾아냅니다.
            # TODO: bucket_name은 실제 사용하는 버킷 이름으로 변경해야 합니다.
            bucket_name = "final_model_data1" 
            storage_client = storage.Client()
            bucket = storage_client.bucket(bucket_name)
            
            # folder_prefix로 시작하는 모든 파일을 리스트로 만듭니다.
            blobs_to_delete = list(bucket.list_blobs(prefix=folder_prefix))

            if not blobs_to_delete:
                print(f"세션 폴더에 삭제할 파일이 없습니다: {folder_prefix}")
                # 파일이 없어도 성공으로 처리할 수 있습니다.
                return Response(
                    {"message": "삭제할 파일이 없지만, 세션 삭제 처리 완료."},
                    status=status.HTTP_204_NO_CONTENT
                )

            # 4. [권능 행사] 찾아낸 모든 파일을 하나씩 소멸시킵니다.
            for blob in blobs_to_delete:
                blob.delete()
                print(f"파일 삭제 성공: {blob.name}")

            print(f"세션 폴더 전체 삭제 성공: {folder_prefix}")
            
            # 5. 임무 완수를 보고합니다.
            return Response(
                {"message": f"세션 '{session_id}'의 모든 파일이 성공적으로 삭제되었습니다."},
                status=status.HTTP_204_NO_CONTENT
            )

        except Exception as e:
            print(f"GCS 세션 폴더 삭제 중 오류 발생: {e}")
            return Response(
                {"error": "서버에서 세션 삭제 중 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# [가상 모델 실행 함수] - 이 부분은 실제 모델 실행 로직에 맞게 수정되어야 합니다.
def run_actual_segmentation_model(task_id, payload):
    total_steps = 10 # 예시: 총 10단계의 작업
    print(f"백그라운드 작업 시작: Task {task_id}")
    try:
        # TODO: 여기에 실제 segmentation 로직을 호출하십시오.
        # 예: from your_ml_app.tasks import process_segmentation
        # process_segmentation(payload) 
        
        # 지금은 진행률을 시뮬레이션합니다.
        for i in range(total_steps + 1):
            progress = int((i / total_steps) * 100)
            cache.set(task_id, {'status': 'processing', 'progress': progress}, timeout=3600)
            print(f"Task {task_id}: 진행률 {progress}%")
            time.sleep(3) # 3초 딜레이로 실제 작업 시간 시뮬레이션
        
        # 작업 완료 후 최종 상태를 저장합니다.
        cache.set(task_id, {'status': 'completed', 'progress': 100, 'result': 'some_result_path'}, timeout=3600)
        print(f"Task {task_id}: 완료")
    except Exception as e:
        print(f"Task {task_id}: 실패 - {e}")
        cache.set(task_id, {'status': 'failed', 'error': str(e)}, timeout=3600)

# 분할 작업을 시작하는 View
class SegmentationAPIView(APIView):
    def post(self, request, *args, **kwargs):
        payload = request.data
        task_id = str(uuid.uuid4())
        thread = threading.Thread(target=run_actual_segmentation_model, args=(task_id, payload))
        thread.start()
        return Response(
            {"message": "분할 작업이 성공적으로 시작되었습니다.", "task_id": task_id},
            status=status.HTTP_202_ACCEPTED
        )

# 작업 상태를 보고하는 View
class TaskStatusAPIView(APIView):
    def get(self, request, task_id, *args, **kwargs):
        task_info = cache.get(task_id)
        if task_info is None:
            return Response({"status": "not_found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(task_info, status=status.HTTP_200_OK)


