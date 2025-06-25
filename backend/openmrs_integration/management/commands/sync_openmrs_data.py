import requests
from requests.auth import HTTPBasicAuth
from django.core.management.base import BaseCommand
from django.conf import settings
from openmrs_integration.models import OpenMRSPatient
from dateutil import parser # 날짜 문자열 파싱 (pip install python-dateutil 필요)
import time

# settings.py에서 OpenMRS 접속 정보 가져오기
OPENMRS_API_BASE_URL = settings.OPENMRS_API_BASE_URL # 예: http://localhost:8080/openmrs/ws/rest/v1
OPENMRS_USER = settings.OPENMRS_USERNAME
OPENMRS_PASS = settings.OPENMRS_PASSWORD

class Command(BaseCommand):
    help = 'Fetches patient data from OpenMRS and stores/updates it in the local Django database'

    def _fetch_openmrs_api(self, api_url):
        """Helper function to fetch data from OpenMRS API."""
        try:
            response = requests.get(
                api_url,
                auth=HTTPBasicAuth(OPENMRS_USER, OPENMRS_PASS),
                headers={'Content-Type': 'application/json', 'Accept': 'application/json'},
                timeout=30 # 30초 타임아웃
            )
            response.raise_for_status() # 200 OK가 아니면 예외 발생
            return response.json()
        except requests.exceptions.HTTPError as http_err:
            self.stderr.write(f"OpenMRS API HTTP Error: {http_err.response.status_code if http_err.response else 'N/A'} for URL: {api_url}")
            self.stderr.write(f"Details: {http_err.response.text if http_err.response else str(http_err)}")
        except requests.exceptions.RequestException as req_err:
            self.stderr.write(f"Request to OpenMRS failed: {req_err} for URL: {api_url}")
        except Exception as e:
            self.stderr.write(f"An unexpected error occurred: {e} for URL: {api_url}")
        return None

    def fetch_all_patients_from_openmrs(self):
        """
        OpenMRS에서 모든 환자를 페이징하여 가져오는 로직.
        이 부분은 OpenMRS API가 '모든 환자' 조회를 어떻게 지원하는지에 따라 강력하게 의존합니다.
        OpenMRS API가 'q' 파라미터 없이 limit과 startIndex만으로 목록 조회를 지원한다고 가정합니다.
        이 가정이 틀렸다면, OpenMRS API 명세에 맞게 이 함수를 수정해야 합니다.
        """
        all_patients_data = []
        current_start_index = 0
        page_limit = 100 # 한 번에 가져올 환자 수 (서버 부하 고려하여 조절)
        
        while True:
            # 이 URL은 OpenMRS API 문서를 통해 '모든 환자(페이징)'를 가져오는 정확한 방식으로 수정해야 합니다.
            # 가장 일반적인 가정: /patient 리소스는 limit과 startIndex 파라미터를 지원한다.
            api_url = f"{OPENMRS_API_BASE_URL}/patient?v=full&limit={page_limit}&startIndex={current_start_index}"
            
            self.stdout.write(f"Fetching patients from OpenMRS: {api_url}")
            response_json = self._fetch_openmrs_api(api_url)

            if response_json is None: # API 호출 중 심각한 오류 발생
                self.stderr.write(self.style.ERROR('Failed to fetch a page of patients. Aborting sync.'))
                return [] # 빈 리스트 반환 또는 예외 발생
            
            results = response_json.get('results', [])
            
            if not results: # 더 이상 가져올 환자가 없음 (빈 배열)
                self.stdout.write("No more patients to fetch or empty results array.")
                break
                
            all_patients_data.extend(results)
            current_start_index += len(results) # 다음 시작 위치 업데이트
            
            if len(results) < page_limit: # 가져온 결과가 limit보다 작으면 마지막 페이지로 간주
                self.stdout.write("Fetched the last page of patients.")
                break
            
            time.sleep(0.5) # OpenMRS 서버에 부담을 주지 않기 위해 약간의 지연 (선택 사항)

        self.stdout.write(f"Fetched a total of {len(all_patients_data)} patient records from OpenMRS.")
        return all_patients_data

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting OpenMRS patient data synchronization...'))
        
        # `python-dateutil` 라이브러리가 설치되어 있어야 합니다. (pip install python-dateutil)
        # 설치되어 있지 않다면, 터미널에서 pip install python-dateutil 실행

        openmrs_patients_raw = self.fetch_all_patients_from_openmrs()
        
        if not openmrs_patients_raw:
            self.stdout.write(self.style.WARNING('No patients fetched from OpenMRS to sync. Exiting.'))
            return

        synced_count = 0
        created_count = 0
        updated_count = 0

        for patient_data in openmrs_patients_raw:
            uuid_str = patient_data.get('uuid')
            if not uuid_str:
                self.stderr.write(f"Skipping patient data with no UUID: {patient_data.get('display')}")
                continue
            
            try:
                patient_uuid = uuid.UUID(uuid_str) # 문자열 UUID를 UUID 객체로 변환
            except ValueError:
                self.stderr.write(f"Invalid UUID format for patient data: {uuid_str}")
                continue

            person_data = patient_data.get('person', {})
            preferred_name_data = person_data.get('preferredName', {})
            
            birthdate_obj = None
            if person_data.get('birthdate'):
                try:
                    # OpenMRS 날짜 형식(예: "2001-02-28T00:00:00.000+0000")을 파싱
                    birthdate_obj = parser.parse(person_data['birthdate']).date()
                except (ValueError, TypeError) as e:
                    self.stderr.write(f"Could not parse birthdate for patient {patient_uuid}: {person_data['birthdate']} - Error: {e}")

            # Django DB에 환자 정보 업데이트 또는 생성
            # identifier는 unique=True로 설정했으므로, 여러 식별자 중 하나를 선택하거나 로직 추가 필요
            # 여기서는 첫 번째 식별자의 identifier 값을 사용
            identifier_value = None
            identifiers = patient_data.get('identifiers')
            if identifiers and isinstance(identifiers, list) and len(identifiers) > 0:
                identifier_value = identifiers[0].get('identifier')

            defaults_data = {
                'display_name': patient_data.get('display'),
                'identifier': identifier_value,
                'given_name': preferred_name_data.get('givenName'),
                'family_name': preferred_name_data.get('familyName'),
                'gender': person_data.get('gender'),
                'birthdate': birthdate_obj,
                'raw_openmrs_data': patient_data, # 전체 JSON 저장
            }
            # None 값을 가진 필드는 defaults에서 제외하여 기존 DB 값을 유지하거나 null로 업데이트 (모델 필드 설정에 따라)
            defaults_data = {k: v for k, v in defaults_data.items() if v is not None}


            patient_obj, created = OpenMRSPatient.objects.update_or_create(
                uuid=patient_uuid,
                defaults=defaults_data
            )
            synced_count += 1
            if created:
                created_count += 1
            else:
                updated_count +=1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully processed {synced_count} patients. New: {created_count}, Updated: {updated_count}.'))