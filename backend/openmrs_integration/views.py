import requests
from requests.auth import HTTPBasicAuth
from django.conf import settings
from .models import OpenMRSPatient
from django.db.models import Q
import uuid
from datetime import datetime, date
import json
import logging
from .serializers import OpenMRSPatientSerializer

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from openmrs_integration.utils import perform_openmrs_patient_sync

# Django settings에서 OpenMRS 관련 설정값 가져오기
OPENMRS_API_BASE_URL = getattr(settings, 'OPENMRS_API_BASE_URL', 'http://openmrs-backend-app:8080/openmrs/ws/rest/v1_fallback_url')
OPENMRS_USERNAME = getattr(settings, 'OPENMRS_USERNAME', 'admin_fallback_user')
OPENMRS_PASSWORD = getattr(settings, 'OPENMRS_PASSWORD', 'Admin123_fallback_pw')

DEFAULT_IDENTIFIER_TYPE_UUID = getattr(settings, 'DEFAULT_OPENMRS_IDENTIFIER_TYPE_UUID', None)
DEFAULT_LOCATION_UUID = getattr(settings, 'DEFAULT_OPENMRS_LOCATION_UUID', None)
PHONE_NUMBER_ATTRIBUTE_TYPE_UUID = getattr(settings, 'OPENMRS_PHONE_ATTRIBUTE_TYPE_UUID', None)

# 로거 설정
logger = logging.getLogger('openmrs_integration')

def is_openmrs_uuid_valid(resource_type, uuid_to_check):
    """Helper function to check if a UUID exists in OpenMRS for a given resource type."""
    if not uuid_to_check:
        logger.error(f"UUID validation: {resource_type} UUID is None or empty.")
        return False
    
    try:
        uuid.UUID(uuid_to_check)
    except ValueError:
        logger.error(f"UUID validation: '{uuid_to_check}' is not a valid UUID format for {resource_type}.")
        return False

    url = f"{OPENMRS_API_BASE_URL}/{resource_type}/{uuid_to_check}"
    log_prefix = f"[is_openmrs_uuid_valid for {resource_type} '{uuid_to_check}']"
    logger.debug(f"{log_prefix} Requesting OpenMRS API: {url}")
    try:
        response = requests.get(url, auth=HTTPBasicAuth(OPENMRS_USERNAME, OPENMRS_PASSWORD), timeout=10)
        logger.debug(f"{log_prefix} Response status: {response.status_code}")
        return response.status_code == 200
    except requests.exceptions.Timeout:
        logger.error(f"{log_prefix} Timeout connecting to OpenMRS API: {url}")
        return False
    except requests.exceptions.ConnectionError:
        logger.error(f"{log_prefix} Connection error to OpenMRS API: {url}")
        return False
    except requests.exceptions.RequestException as e:
        logger.error(f"{log_prefix} Error during OpenMRS API request: {e}")
        return False

@api_view(['GET'])
@permission_classes([AllowAny])
def get_django_patient_list_only(request):
    query = request.GET.get('q', '')
    try:
        limit = int(request.GET.get('limit', settings.OPENMRS_PATIENT_LIST_DEFAULT_LIMIT))
        start_index = int(request.GET.get('startIndex', '0'))
    except ValueError:
        limit = settings.OPENMRS_PATIENT_LIST_DEFAULT_LIMIT
        start_index = 0

    logger.info(f"get_django_patient_list_only: Query='{query}', Limit={limit}, StartIndex={start_index}")
    
    try:
        # 1. 기본 쿼리셋 구성
        base_qs = OpenMRSPatient.objects.all()
        
        # 2. 검색 조건 적용
        if query:
            logger.debug(f"Applying filter for query: '{query}'")
            try:
                uuid_query = uuid.UUID(query)
                base_qs = base_qs.filter(uuid=uuid_query)
            except ValueError:
                base_qs = base_qs.filter(
                    Q(display_name__icontains=query) |
                    Q(identifier__icontains=query) |
                    Q(given_name__icontains=query) |
                    Q(family_name__icontains=query)
                )

        # 3. 정렬 및 페이징
        patients_qs = base_qs.order_by('display_name')
        total_count = patients_qs.count()
        patients_page = patients_qs[start_index : start_index + limit]

        # 4. 시리얼라이저 사용
        serializer = OpenMRSPatientSerializer(patients_page, many=True)
        
        return Response({
            'results': serializer.data,
            'totalCount': total_count
        })

    except Exception as e:
        logger.exception(f"Error in get_django_patient_list_only: {str(e)}")
        return Response(
            {'error': f'Database error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_patients_and_sync_from_openmrs(request):
    logger.info("get_patients_and_sync_from_openmrs: Received request.")
    default_sync_query = getattr(settings, 'DEFAULT_OPENMRS_SYNC_QUERY', "100")
    sync_query_from_request = request.GET.get('sync_q', default_sync_query)
    sync_limit = int(request.GET.get('sync_limit', 50))
    sync_max = int(request.GET.get('sync_max', 200))
    sync_error_detail = None

    try:
        logger.info(f"get_patients_and_sync_from_openmrs: Triggering OpenMRS sync with query='{sync_query_from_request}', limit_per_call={sync_limit}, max_total_to_sync={sync_max}")
        def view_logger(message, style_func_name=None): 
            logger.info(f"[SYNC_UTIL_IN_VIEW] {message}")
        
        perform_openmrs_patient_sync( 
            query_term=sync_query_from_request, limit_per_call=sync_limit,
            max_total_to_sync=sync_max, progress_logger=view_logger
        )
        logger.info(f"get_patients_and_sync_from_openmrs: Sync utility finished.")
    except Exception as e:
        sync_error_message = f"Error during OpenMRS sync: {type(e).__name__} - {str(e)}"
        logger.exception(f"get_patients_and_sync_from_openmrs: {sync_error_message}")
        sync_error_detail = sync_error_message

    # 동기화 후 로컬 DB에서 다시 목록 조회
    query_for_list = request.GET.get('q', '')
    limit_for_list = int(request.GET.get('limit', settings.OPENMRS_PATIENT_LIST_DEFAULT_LIMIT))
    start_index_for_list = int(request.GET.get('startIndex', '0'))
    logger.info(f"get_patients_and_sync_from_openmrs: Fetching final list from LOCAL DJANGO DB. Query: '{query_for_list}'")
    
    try:
        base_qs = OpenMRSPatient.objects.all()
        if query_for_list:
            try:
                uuid_query_list = uuid.UUID(query_for_list)
                base_qs = base_qs.filter(uuid=uuid_query_list)
            except ValueError:
                base_qs = base_qs.filter(
                    Q(display_name__icontains=query_for_list) | Q(identifier__icontains=query_for_list) |
                    Q(given_name__icontains=query_for_list) | Q(family_name__icontains=query_for_list)
                )
        
        patients_qs_ordered = base_qs.order_by('display_name')
        total_patients = patients_qs_ordered.count()
        patients_to_display = patients_qs_ordered[start_index_for_list : start_index_for_list + limit_for_list]

        # ✅ 시리얼라이저 사용으로 변경
        serializer = OpenMRSPatientSerializer(patients_to_display, many=True)
        
        response_payload = {'results': serializer.data, 'totalCount': total_patients}
        if sync_error_detail: 
            response_payload['sync_error_detail'] = sync_error_detail
        
        logger.info(f"get_patients_and_sync_from_openmrs: Returning list. Sync error (if any): {sync_error_detail}")
        return Response(response_payload)
        
    except Exception as e:
        logger.exception(f"get_patients_and_sync_from_openmrs: Error fetching list from local DB after sync: {e}")
        return Response({
            'error': f'Error fetching list from Django DB: {str(e)}', 
            'sync_error_detail': sync_error_detail
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_patient_in_openmrs_and_django(request):
    logger.info(f"create_patient_in_openmrs_and_django: Received request data: {request.data}")
    data = request.data

    identifier_type_uuid_from_settings = DEFAULT_IDENTIFIER_TYPE_UUID
    location_uuid_from_settings = DEFAULT_LOCATION_UUID
    phone_attr_type_uuid_from_settings = PHONE_NUMBER_ATTRIBUTE_TYPE_UUID
    
    logger.debug(f"Using IdentifierTypeUUID: {identifier_type_uuid_from_settings}")
    logger.debug(f"Using LocationUUID: {location_uuid_from_settings}")
    logger.debug(f"Using PhoneAttributeTypeUUID (if phone provided): {phone_attr_type_uuid_from_settings}")

    # UUID 유효성 사전 확인
    if not identifier_type_uuid_from_settings or \
       not is_openmrs_uuid_valid('patientidentifiertype', identifier_type_uuid_from_settings):
        error_msg = "Configuration Error: DEFAULT_OPENMRS_IDENTIFIER_TYPE_UUID from settings is invalid, not found in OpenMRS, or OpenMRS API is not reachable."
        logger.error(f"CRITICAL - Patient Create: {error_msg} (Value was: '{identifier_type_uuid_from_settings}')")
        return Response({'error': error_msg, 'detail': 'Please check .env, Django settings, OpenMRS configuration for patient identifier types, and OpenMRS API reachability.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if not location_uuid_from_settings or \
       not is_openmrs_uuid_valid('location', location_uuid_from_settings):
        error_msg = "Configuration Error: DEFAULT_OPENMRS_LOCATION_UUID from settings is invalid, not found in OpenMRS, or OpenMRS API is not reachable."
        logger.error(f"CRITICAL - Patient Create: {error_msg} (Value was: '{location_uuid_from_settings}')")
        return Response({'error': error_msg, 'detail': 'Please check .env, Django settings, OpenMRS configuration for locations, and OpenMRS API reachability.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    if data.get('phoneNumber') and phone_attr_type_uuid_from_settings and \
       not is_openmrs_uuid_valid('personattributetype', phone_attr_type_uuid_from_settings):
        error_msg = "Configuration Error: OPENMRS_PHONE_ATTRIBUTE_TYPE_UUID from settings is invalid, not found in OpenMRS, or OpenMRS API is not reachable."
        logger.warning(f"Patient Create: {error_msg} (Value was: '{phone_attr_type_uuid_from_settings}'). Phone number will not be saved as an attribute.")
        phone_attr_type_uuid_from_settings = None

    try:
        given_name = data.get('givenName')
        family_name = data.get('familyName')
        gender = data.get('gender')
        birthdate_str = data.get('birthdate')
        identifier_value = data.get('identifier')

        address1 = data.get('address1', '')
        city_village = data.get('cityVillage', '')
        phone_number_str = data.get('phoneNumber', '')

        if not (given_name and family_name and gender and birthdate_str and identifier_value):
            logger.error(f"create_patient_in_openmrs_and_django: Missing required fields. Data: {data}")
            return Response({'error': 'Missing required fields (givenName, familyName, gender, birthdate, identifier)'}, status=status.HTTP_400_BAD_REQUEST)

        person_payload = {
            "names": [{"givenName": given_name, "familyName": family_name, "preferred": True}],
            "gender": gender,
            "birthdate": birthdate_str,
            "attributes": []
        }

        # 2. 주소 정보가 있을 때만 addresses 필드를 추가합니다.
        if address1 or city_village:
            person_payload["addresses"] = [{"address1": address1, "cityVillage": city_village, "preferred": True}]

        # 3. 전화번호 정보가 있을 때만 attributes에 추가합니다.
        if phone_number_str and phone_attr_type_uuid_from_settings:
            person_payload["attributes"].append({
                "attributeType": phone_attr_type_uuid_from_settings, "value": phone_number_str
            })

        # 4. 최종 페이로드를 조립합니다.
        openmrs_payload = {
            "person": person_payload,
            "identifiers": [{
                "identifier": identifier_value,
                "identifierType": identifier_type_uuid_from_settings,
                "location": location_uuid_from_settings,
                "preferred": True
            }]
        }
        
        api_url = f"{OPENMRS_API_BASE_URL}/patient"
        logger.info(f"Posting to OpenMRS API: {api_url} with payload: {json.dumps(openmrs_payload, indent=2, ensure_ascii=False)}")

        omrs_response = requests.post(
            api_url, json=openmrs_payload, auth=HTTPBasicAuth(OPENMRS_USERNAME, OPENMRS_PASSWORD),
            headers={'Content-Type': 'application/json', 'Accept': 'application/json'}, timeout=20
        )
        
        logger.info(f"OpenMRS API response status for patient creation: {omrs_response.status_code}")
        omrs_response.raise_for_status()
        
        created_openmrs_patient_data = omrs_response.json()
        logger.info(f"Successfully created patient in OpenMRS: UUID={created_openmrs_patient_data.get('uuid')}")
        
        # Django DB 저장 로직
        try:
            new_patient_uuid = uuid.UUID(created_openmrs_patient_data.get('uuid'))
            resp_identifiers = created_openmrs_patient_data.get('identifiers', [])
            resp_main_identifier = resp_identifiers[0].get('identifier') if resp_identifiers and len(resp_identifiers) > 0 and resp_identifiers[0] else None
            
            resp_person_data = created_openmrs_patient_data.get('person', {})
            if not resp_person_data: 
                resp_person_data = {}
            resp_preferred_name = resp_person_data.get('preferredName', {})
            if not resp_preferred_name: 
                resp_preferred_name = {}
            resp_birthdate_str = resp_person_data.get('birthdate')
            birthdate_obj_for_db = None
            
            if resp_birthdate_str:
                try: 
                    birthdate_obj_for_db = datetime.fromisoformat(resp_birthdate_str.replace("Z", "+00:00")).date()
                except ValueError:
                    try: 
                        birthdate_obj_for_db = datetime.strptime(resp_birthdate_str.split('T')[0], '%Y-%m-%d').date()
                    except ValueError: 
                        logger.warning(f"Could not parse birthdate '{resp_birthdate_str}' from OpenMRS response for DB save.")
                        birthdate_obj_for_db = None
            
            patient_obj, created_in_django = OpenMRSPatient.objects.update_or_create(
                uuid=new_patient_uuid,
                defaults={
                    'display_name': created_openmrs_patient_data.get('display'), 
                    'identifier': resp_main_identifier, 
                    'given_name': resp_preferred_name.get('givenName'), 
                    'family_name': resp_preferred_name.get('familyName'),
                    'gender': resp_person_data.get('gender'), 
                    'birthdate': birthdate_obj_for_db,
                    'raw_openmrs_data': created_openmrs_patient_data
                }
            )
            log_action = "CREATED" if created_in_django else "UPDATED"
            logger.info(f"Patient {new_patient_uuid} {log_action} in Django DB.")
        except Exception as db_error:
            logger.exception(f"Error saving created OpenMRS patient ({created_openmrs_patient_data.get('uuid')}) to Django DB: {type(db_error).__name__} - {db_error}")
        
        return Response(created_openmrs_patient_data, status=status.HTTP_201_CREATED)

    except requests.exceptions.HTTPError as err:
        error_message = f'Failed to create patient in OpenMRS (HTTP Error)'
        error_detail_text = "No details from OpenMRS or error in parsing response." 
        response_status_code_final = status.HTTP_500_INTERNAL_SERVER_ERROR 
        if err.response is not None:
            error_message = f'Failed to create patient in OpenMRS: {err.response.status_code} {err.response.reason}'
            try:
                error_detail_json = err.response.json()
                error_detail_text = error_detail_json.get('error', {}).get('message', err.response.text)
            except ValueError:
                error_detail_text = err.response.text 
            response_status_code_final = err.response.status_code
        logger.error(f"HTTP error creating patient in OpenMRS. Status: {response_status_code_final}. Error Obj: {err}. Full Response Text (first 500 chars): {error_detail_text[:500]}")
        return Response({'error': error_message, 'detail': error_detail_text[:1000]}, status=response_status_code_final)
    
    except requests.exceptions.JSONDecodeError as json_err: 
        error_message = 'Failed to parse OpenMRS response as JSON after patient creation attempt.'
        response_text_sample = ""
        omrs_response_status = 'N/A'
        if 'omrs_response' in locals() and hasattr(omrs_response, 'text'):
            response_text_sample = omrs_response.text[:1000]
            omrs_response_status = omrs_response.status_code

        logger.error(f"JSONDecodeError - {json_err}. OpenMRS response status: {omrs_response_status}. Response text sample: {response_text_sample}")
        return Response({'error': error_message, 'detail': f"OpenMRS status: {omrs_response_status}. Response might not be JSON. Sample: {response_text_sample}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except requests.exceptions.RequestException as req_err: 
        logger.exception(f"Network error or other RequestException connecting to OpenMRS for patient creation: {req_err}")
        return Response({'error': f'Network error connecting to OpenMRS: {str(req_err)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
    except Exception as e: 
        logger.exception(f"Unexpected error in create_patient_in_openmrs_and_django: {type(e).__name__} - {e}")
        return Response({'error': f'An unexpected server error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ✅ 핵심 수정: get_openmrs_patient_detail 함수에서 OpenMRSPatientSerializer 사용
@api_view(['GET'])
@permission_classes([AllowAny])
def get_openmrs_patient_detail(request, patient_uuid):
    logger.info(f"get_openmrs_patient_detail: Received request for UUID: {patient_uuid}")
    try:
        valid_uuid = uuid.UUID(str(patient_uuid))
        
        patient_model_instance = None
        # 먼저 Django DB에서 찾아봅니다.
        try:
            patient_model_instance = OpenMRSPatient.objects.get(uuid=valid_uuid)
            if patient_model_instance.raw_openmrs_data and isinstance(patient_model_instance.raw_openmrs_data, dict):
                logger.info(f"Fetching patient {valid_uuid} from Django DB (using existing raw_openmrs_data)")
                # ✅ Django 모델 인스턴스를 Serializer를 통해 직렬화하여 반환
                serializer = OpenMRSPatientSerializer(patient_model_instance)
                return Response(serializer.data)
            logger.info(f"Patient {valid_uuid} found in Django DB but raw_openmrs_data is missing or invalid, will fetch fresh from OpenMRS...")
        except OpenMRSPatient.DoesNotExist:
            logger.info(f"Patient {valid_uuid} not found in Django DB, will fetch from OpenMRS...")

        # Django DB에 없거나 raw_openmrs_data가 없다면 OpenMRS에서 가져옵니다.
        api_url = f"{OPENMRS_API_BASE_URL}/patient/{valid_uuid}?v=full"
        logger.info(f"Requesting OpenMRS API: {api_url}")
        
        response_from_omrs = requests.get(
            api_url, auth=HTTPBasicAuth(OPENMRS_USERNAME, OPENMRS_PASSWORD),
            headers={'Content-Type': 'application/json', 'Accept': 'application/json'}, timeout=10
        )
        response_from_omrs.raise_for_status()
        openmrs_patient_data = response_from_omrs.json()
        logger.info(f"Successfully fetched data from OpenMRS for patient {valid_uuid}")

        # 가져온 데이터를 Django DB에 저장 또는 업데이트
        # 이 부분은 OpenMRSPatientSerializer를 사용하지 않고 직접 필드 매핑을 합니다.
        try:
            identifiers = openmrs_patient_data.get('identifiers', [])
            main_identifier = identifiers[0].get('identifier') if identifiers and len(identifiers) > 0 and identifiers[0] else None
            person_data = openmrs_patient_data.get('person', {})
            preferred_name = person_data.get('preferredName', {})
            birthdate_str = person_data.get('birthdate')
            birthdate_obj = None
            if birthdate_str:
                try: 
                    birthdate_obj = datetime.fromisoformat(birthdate_str.replace("Z", "+00:00")).date()
                except ValueError:
                    try: 
                        birthdate_obj = datetime.strptime(birthdate_str.split('T')[0], '%Y-%m-%d').date()
                    except ValueError: 
                        logger.warning(f"Could not parse birthdate '{birthdate_str}' for patient {valid_uuid} from OpenMRS.")
                        birthdate_obj = None
            
            patient_obj, created_in_django = OpenMRSPatient.objects.update_or_create(
                uuid=valid_uuid,
                defaults={
                    'display_name': openmrs_patient_data.get('display'), 
                    'identifier': main_identifier,
                    'given_name': preferred_name.get('givenName'), 
                    'family_name': preferred_name.get('familyName'),
                    'gender': person_data.get('gender'), 
                    'birthdate': birthdate_obj, 
                    'raw_openmrs_data': openmrs_patient_data
                }
            )
            log_action = "CREATED" if created_in_django else "UPDATED"
            logger.info(f"Patient {valid_uuid} data saved/updated in Django DB.")
        except Exception as db_error:
            logger.exception(f"Error saving created OpenMRS patient ({valid_uuid}) to Django DB: {type(db_error).__name__} - {db_error}")
        
        # ✅ OpenMRS에서 가져온 raw data를 저장 후, OpenMRSPatientSerializer를 통해 직렬화하여 반환
        serializer = OpenMRSPatientSerializer(OpenMRSPatient.objects.get(uuid=valid_uuid))
        return Response(serializer.data)

    except ValueError: 
        logger.error(f"Invalid UUID format provided for patient detail: {patient_uuid}")
        return Response({'error': 'Invalid UUID format provided.'}, status=status.HTTP_400_BAD_REQUEST)
    except requests.exceptions.HTTPError as err:
        if err.response is not None and err.response.status_code == 404:
            logger.warning(f"Patient (UUID: {patient_uuid}) not found in OpenMRS.")
            return Response({'error': f'Patient (UUID: {patient_uuid}) not found in OpenMRS.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            status_code = err.response.status_code if err.response is not None else status.HTTP_500_INTERNAL_SERVER_ERROR
            reason = err.response.reason if err.response is not None else "Unknown Reason"
            detail_text = err.response.text if err.response is not None else 'No response text'
            logger.error(f"HTTP error fetching detail for {patient_uuid} from OpenMRS: Status {status_code} {reason}. Detail: {detail_text[:500]}")
            return Response({'error': f'Error fetching detail from OpenMRS: {status_code} {reason}', 'detail': detail_text}, status=status_code)
    except requests.exceptions.RequestException as req_err:
        logger.exception(f"Network error connecting to OpenMRS for patient detail {patient_uuid}: {req_err}")
        return Response({'error': f'Network error connecting to OpenMRS: {str(req_err)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        logger.exception(f"Unexpected error in get_openmrs_patient_detail for {patient_uuid}: {type(e).__name__}: {e}")
        return Response({'error': f'An unexpected server error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
