import requests
import logging
from datetime import datetime
from django.conf import settings
from .models import OpenMRSPatient

logger = logging.getLogger(__name__)

class OpenMRSService:
    def __init__(self):
        self.base_url = getattr(settings, 'OPENMRS_BASE_URL', 'http://34.64.188.9:8080/openmrs')
        self.username = getattr(settings, 'OPENMRS_USERNAME', 'admin')
        self.password = getattr(settings, 'OPENMRS_PASSWORD', 'Admin123')
        
    def get_auth(self):
        return (self.username, self.password)
    
    def sync_patients(self):
        """OpenMRS에서 환자 데이터를 가져와서 Django DB에 저장"""
        try:
            # OpenMRS API에서 환자 목록 가져오기
            url = f"{self.base_url}/ws/rest/v1/patient"
            params = {
                'v': 'full',  # 전체 정보 가져오기
                'limit': 100
            }
            
            response = requests.get(url, auth=self.get_auth(), params=params)
            response.raise_for_status()
            
            data = response.json()
            patients_data = data.get('results', [])
            
            logger.info(f"OpenMRS에서 {len(patients_data)}명의 환자 데이터를 가져왔습니다.")
            
            synced_count = 0
            for patient_data in patients_data:
                if self.save_patient(patient_data):
                    synced_count += 1
                    
            logger.info(f"{synced_count}명의 환자 데이터가 동기화되었습니다.")
            return synced_count
            
        except Exception as e:
            logger.error(f"환자 동기화 중 오류 발생: {str(e)}")
            return 0
    
    def save_patient(self, patient_data):
        """개별 환자 데이터를 파싱하고 저장"""
        try:
            # UUID 추출
            uuid_str = patient_data.get('uuid')
            if not uuid_str:
                logger.warning("UUID가 없는 환자 데이터를 건너뜁니다.")
                return False
            
            # 기본 정보 추출
            display_name = patient_data.get('display', '')
            
            # Person 정보에서 상세 데이터 추출
            person = patient_data.get('person', {})
            gender = person.get('gender', '')
            birthdate_str = person.get('birthdate', '')
            
            # 생년월일 파싱
            birthdate = None
            if birthdate_str:
                try:
                    birthdate = datetime.strptime(birthdate_str, '%Y-%m-%d').date()
                except:
                    try:
                        birthdate = datetime.strptime(birthdate_str[:10], '%Y-%m-%d').date()
                    except:
                        logger.warning(f"생년월일 파싱 실패: {birthdate_str}")
            
            # 이름 정보 추출
            given_name = ''
            family_name = ''
            
            # preferredName에서 추출 시도
            preferred_name = person.get('preferredName', {})
            if preferred_name:
                given_name = preferred_name.get('givenName', '')
                family_name = preferred_name.get('familyName', '')
            
            # preferredName이 없다면 names 배열에서 추출
            if not given_name and not family_name:
                names = person.get('names', [])
                if names:
                    first_name = names[0]
                    given_name = first_name.get('givenName', '')
                    family_name = first_name.get('familyName', '')
            
            # 환자 식별자 추출
            identifiers = patient_data.get('identifiers', [])
            identifier = ''
            if identifiers:
                # 첫 번째 식별자 사용
                identifier = identifiers[0].get('identifier', '')
            
            # display_name이 비어있다면 이름으로 구성
            if not display_name:
                name_parts = [part for part in [given_name, family_name] if part]
                if name_parts:
                    display_name = ' '.join(name_parts)
                elif identifier:
                    display_name = identifier
                else:
                    display_name = f"Patient {uuid_str[:8]}"
            
            # 데이터베이스에 저장 또는 업데이트
            patient, created = OpenMRSPatient.objects.update_or_create(
                uuid=uuid_str,
                defaults={
                    'identifier': identifier,
                    'display_name': display_name,
                    'given_name': given_name,
                    'family_name': family_name,
                    'gender': gender,
                    'birthdate': birthdate,
                    'raw_openmrs_data': patient_data
                }
            )
            
            action = "생성" if created else "업데이트"
            logger.info(f"환자 {action}: {display_name} (ID: {identifier})")
            return True
            
        except Exception as e:
            logger.error(f"환자 데이터 저장 중 오류: {str(e)}")
            logger.error(f"문제가 된 데이터: {patient_data}")
            return False
    
    def get_patient_by_uuid(self, uuid):
        """UUID로 특정 환자 정보 가져오기"""
        try:
            url = f"{self.base_url}/ws/rest/v1/patient/{uuid}"
            params = {'v': 'full'}
            
            response = requests.get(url, auth=self.get_auth(), params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"환자 정보 조회 중 오류: {str(e)}")
            return None