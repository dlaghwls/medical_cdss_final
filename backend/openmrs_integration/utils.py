# medical_cdss-happy/backend/medical_cdss/openmrs_integration/utils.py

from django.conf import settings
import requests
from requests.auth import HTTPBasicAuth
import uuid
from .models import OpenMRSPatient 
from datetime import datetime
import json # JSON 데이터 처리를 위해 추가
import logging # 로깅을 위해 추가
import pytz # 시간대 처리를 위해 추가 (날짜/시간 관련)

logger = logging.getLogger(__name__) # 로거 인스턴스 생성

# settings.py에서 OpenMRS API 기본 정보 가져오기
# OPENMRS_API_BASE_URL은 /ws/rest/v1까지 포함한다고 가정합니다.
OPENMRS_API_BASE_URL = getattr(settings, 'OPENMRS_API_BASE_URL', 'http://localhost:8080/openmrs/ws/rest/v1')
OPENMRS_USERNAME = getattr(settings, 'OPENMRS_USERNAME', 'admin')
OPENMRS_PASSWORD = getattr(settings, 'OPENMRS_PASSWORD', 'Admin123')

# API 루트 URL (기존 설정 그대로 사용)
OPENMRS_API_ROOT = OPENMRS_API_BASE_URL

# 인증 헤더 생성 헬퍼 함수
def get_auth_headers():
    auth_string = f"{OPENMRS_USERNAME}:{OPENMRS_PASSWORD}"
    # Basic 인증을 위한 Base64 인코딩
    return {
        'Content-Type': 'application/json',
        'Authorization': f'Basic {requests.utils.b64encode(auth_string.encode()).decode()}'
    }

# --- 기존 perform_openmrs_patient_sync 함수는 그대로 둡니다. ---

def perform_openmrs_patient_sync(query_term="1000", limit_per_call=50, max_total_to_sync=1000, progress_logger=None):
    if progress_logger is None:
        def default_logger(message, style_func_name=None):
            print(message)
        progress_logger = default_logger

    progress_logger(f"SYNC UTILITY: Starting sync from OpenMRS with query='{query_term}', limit_per_call={limit_per_call}, max_total_to_sync={max_total_to_sync}", 'INFO')

    synced_count = 0
    start_index = 0
    has_more_patients = True

    while has_more_patients and synced_count < max_total_to_sync:
        try:
            api_url = f"{OPENMRS_API_ROOT}/patient" # 기존 OpenMRS_API_BASE_URL 대신 OPENMRS_API_ROOT 사용
            params = {
                'v': 'full',
                'limit': limit_per_call,
                'startIndex': start_index,
            }
            if query_term: 
                params['q'] = query_term
            
            progress_logger(f"SYNC UTILITY: Requesting OpenMRS API - URL: {api_url}, Params: {params}", 'INFO')
            
            response = requests.get(
                api_url, params=params, auth=HTTPBasicAuth(OPENMRS_USERNAME, OPENMRS_PASSWORD),
                headers={'Content-Type': 'application/json', 'Accept': 'application/json'}, timeout=60
            )
            progress_logger(f"SYNC UTILITY: OpenMRS API response status: {response.status_code}", 'INFO')
            response.raise_for_status()
            
            openmrs_response_data = response.json()
            openmrs_patients_list = openmrs_response_data.get('results', [])

            if not openmrs_patients_list:
                has_more_patients = False
                log_msg = f"No patients found in OpenMRS for query '{query_term}'"
                if start_index == 0: log_msg += " on the first page."
                else: log_msg += " on subsequent pages."
                progress_logger(log_msg, 'WARNING')
                break

            progress_logger(f"SYNC UTILITY: Fetched {len(openmrs_patients_list)} patients. Processing (current synced: {synced_count}, startIndex: {start_index})...", 'INFO')

            for patient_data in openmrs_patients_list:
                try:
                    patient_uuid_str = patient_data.get('uuid')
                    if not patient_uuid_str:
                        progress_logger(f"SYNC UTILITY: Skipping patient data with no UUID: {patient_data.get('display')}", 'WARNING')
                        continue
                    valid_uuid = uuid.UUID(patient_uuid_str)
                    identifiers = patient_data.get('identifiers', [])
                    main_identifier = identifiers[0].get('identifier') if identifiers and len(identifiers) > 0 and identifiers[0] else None
                    person_data = patient_data.get('person', {})
                    if not person_data: person_data = {}
                    preferred_name = person_data.get('preferredName', {})
                    if not preferred_name: preferred_name = {}
                    birthdate_str = person_data.get('birthdate')
                    birthdate_obj = None
                    if birthdate_str:
                        try:
                            birthdate_obj = datetime.fromisoformat(birthdate_str.replace("Z", "+00:00")).date()
                        except ValueError:
                            try:
                                birthdate_obj = datetime.strptime(birthdate_str.split('T')[0], '%Y-%m-%d').date()
                            except ValueError:
                                progress_logger(f"SYNC UTILITY: Could not parse birthdate: {birthdate_str} for patient {valid_uuid}", 'WARNING')
                                birthdate_obj = None
                            
                    obj, created = OpenMRSPatient.objects.update_or_create(
                        uuid=valid_uuid,
                        defaults={
                            'display_name': patient_data.get('display'),
                            'identifier': main_identifier,
                            'given_name': preferred_name.get('givenName'),
                            'family_name': preferred_name.get('familyName'),
                            'gender': person_data.get('gender'),
                            'birthdate': birthdate_obj,
                            'raw_openmrs_data': patient_data
                        }
                    )
                    log_prefix = "CREATED" if created else "UPDATED"
                    progress_logger(f"SYNC UTILITY: {log_prefix}: Patient {valid_uuid} - {patient_data.get('display')}", 'SUCCESS' if created else 'INFO')
                    
                    synced_count += 1
                    if synced_count >= max_total_to_sync:
                        has_more_patients = False
                        progress_logger(f"SYNC UTILITY: Reached max_patients limit: {max_total_to_sync}", 'WARNING')
                        break
                except Exception as db_error:
                    progress_logger(f"SYNC UTILITY: Error saving/updating patient {patient_data.get('uuid')} to Django DB: {type(db_error).__name__} - {db_error}", 'ERROR')

            if not has_more_patients: break
            start_index += len(openmrs_patients_list)
            if len(openmrs_patients_list) < limit_per_call:
                has_more_patients = False
                progress_logger(f"SYNC UTILITY: Fetched all available patients for query '{query_term}'.", 'SUCCESS')

        except requests.exceptions.HTTPError as err:
            error_detail = err.response.text if err.response is not None else "No response text"
            status_code = err.response.status_code if err.response is not None else "Unknown"
            reason = err.response.reason if err.response is not None else "Unknown"
            progress_logger(f"SYNC UTILITY: HTTP error - {status_code} {reason}. Detail: {error_detail[:200]}...", 'ERROR')
            has_more_patients = False
        except requests.exceptions.JSONDecodeError as err_json:
            raw_text = response.text[:200] if 'response' in locals() and hasattr(response, 'text') else 'N/A'
            progress_logger(f"SYNC UTILITY: JSONDecodeError - {err_json}. Raw text: {raw_text}...", 'ERROR')
            has_more_patients = False
        except requests.exceptions.RequestException as err:
            progress_logger(f"SYNC UTILITY: Network error - {err}", 'ERROR')
            has_more_patients = False
        except Exception as e:
            progress_logger(f"SYNC UTILITY: Unexpected error - {type(e).__name__}: {e}", 'ERROR')
            has_more_patients = False

    progress_logger(f"SYNC UTILITY: Finished. Total patients processed/synced: {synced_count}", 'SUCCESS')
    return synced_count


# --- ★★★ 새로 추가할 OpenMRS Obs (활력 징후) 관련 API 호출 함수들 ★★★ ---

# 특정 환자의 활력 징후 Observations 가져오기
def get_patient_vitals_from_openmrs(patient_uuid, concept_uuids=None, limit=None):
    headers = get_auth_headers()
    params = {
        'patient': patient_uuid,
        'v': 'full' # 상세 정보를 가져오기 위함
    }
    if concept_uuids: # 특정 Concept UUIDs만 필터링 (콤마로 구분)
        params['concept'] = ','.join(concept_uuids) 
    if limit: # 결과 개수 제한
        params['limit'] = limit

    try:
        response = requests.get(f"{OPENMRS_API_ROOT}/obs", headers=headers, params=params, timeout=10)
        response.raise_for_status() # HTTP 오류가 발생하면 예외 발생
        obs_data = response.json()
        logger.debug(f"OpenMRS: Fetched obs for patient {patient_uuid}, response: {obs_data}")
        return obs_data.get('results', []) # 'results' 키 아래에 Observations 리스트 반환
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenMRS: Error fetching obs for patient {patient_uuid}: {e}", exc_info=True)
        if e.response:
            logger.error(f"OpenMRS: Response content: {e.response.text}")
        raise # 예외를 다시 발생시켜 상위 호출자에게 전달

# OpenMRS에 새로운 Observation (활력 징후) 생성
def create_observation_in_openmrs(patient_uuid, concept_uuid, value, obs_datetime, location_uuid, encounter_uuid=None):
    headers = get_auth_headers()
    payload = {
        "person": patient_uuid, # 환자 UUID
        "concept": concept_uuid, # 활력 징후 Concept UUID
        "obsDatetime": obs_datetime, # ISO 8601 형식 (예: 2023-10-26T10:00:00.000+0900)
        "value": value, # 측정 수치
        "location": location_uuid, # 측정 장소 UUID
    }
    if encounter_uuid: # Encounter UUID가 있다면 연결
        payload["encounter"] = encounter_uuid

    try:
        response = requests.post(f"{OPENMRS_API_ROOT}/obs", headers=headers, data=json.dumps(payload), timeout=10)
        response.raise_for_status() # HTTP 오류가 발생하면 예외 발생
        obs_response = response.json()
        logger.info(f"OpenMRS: Created observation {concept_uuid} for patient {patient_uuid}, response: {obs_response}")
        return obs_response
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenMRS: Error creating observation {concept_uuid} for patient {patient_uuid}: {e}", exc_info=True)
        if e.response:
            logger.error(f"OpenMRS: Response content: {e.response.text}")
        raise

# OpenMRS에 Encounter (만남/접촉) 생성 (활력 징후를 연결하기 위해 필요)
def create_encounter_in_openmrs(patient_uuid, encounter_type_uuid, encounter_datetime, location_uuid, provider_uuid=None):
    headers = get_auth_headers()
    payload = {
        "patient": patient_uuid, # 환자 UUID
        "encounterDatetime": encounter_datetime, # 만남 시간 (ISO 8601)
        "encounterType": encounter_type_uuid, # 만남 유형 Concept UUID (예: Vitals Encounter Type)
        "location": location_uuid, # 만남 장소 UUID
        "form": None # 특정 폼에 연결하지 않음 (대부분의 경우 None)
    }
    if provider_uuid: # 제공자 UUID (만남을 기록한 의료진)
        # Provider UUID는 OpenMRS Provider 객체의 UUID입니다.
        # OpenMRS에서는 Provider와 User가 별도의 개념입니다.
        # 현재 로그인된 User의 UUID와 직접 연결되지 않을 수 있습니다.
        payload["provider"] = provider_uuid 

    try:
        response = requests.post(f"{OPENMRS_API_ROOT}/encounter", headers=headers, data=json.dumps(payload), timeout=10)
        response.raise_for_status()
        encounter_response = response.json()
        logger.info(f"OpenMRS: Created encounter for patient {patient_uuid}, response: {encounter_response}")
        return encounter_response
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenMRS: Error creating encounter for patient {patient_uuid}: {e}", exc_info=True)
        if e.response:
            logger.error(f"OpenMRS: Response content: {e.response.text}")
        raise

# 현재 로그인된 Django User의 username을 OpenMRS Provider의 UUID로 가져오는 헬퍼 (옵션)
# 활력 징후 기록 시 'provider' 필드를 채우려면 필요합니다.
def get_provider_uuid_for_user(username): 
    headers = get_auth_headers()
    try:
        # OpenMRS API를 통해 제공자 검색. 'q' 파라미터는 이름 검색용.
        response = requests.get(f"{OPENMRS_API_ROOT}/provider?q={username}&v=full", headers=headers, timeout=10)
        response.raise_for_status()
        providers = response.json().get('results', [])
        if providers:
            # 첫 번째 일치하는 제공자의 UUID를 반환합니다.
            return providers[0]['uuid']
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenMRS: Error fetching provider for user {username}: {e}", exc_info=True)
        return None
