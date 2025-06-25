import requests
import json
import base64
from django.conf import settings
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class OpenMRSService:
    """OpenMRS API 연동 서비스"""
    
    def __init__(self):
        self.base_url = settings.OPENMRS_BASE_URL
        self.username = settings.OPENMRS_USERNAME
        self.password = settings.OPENMRS_PASSWORD
        self.session = requests.Session()
        self._setup_auth()
    
    def _setup_auth(self):
        """Basic Auth 설정"""
        credentials = f"{self.username}:{self.password}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        self.session.headers.update({
            'Authorization': f'Basic {encoded_credentials}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def _make_request(self, method, endpoint, data=None, params=None):
        """API 요청 공통 처리"""
        url = f"{self.base_url}/ws/rest/v1/{endpoint}"
        
        try:
            if method == 'GET':
                response = self.session.get(url, params=params)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            elif method == 'PUT':
                response = self.session.put(url, json=data)
            elif method == 'DELETE':
                response = self.session.delete(url)
            
            response.raise_for_status()
            return response.json() if response.content else {}
            
        except requests.exceptions.RequestException as e:
            logger.error(f"OpenMRS API 요청 실패: {e}")
            raise Exception(f"OpenMRS API 연결 실패: {str(e)}")
    
    def test_connection(self):
        """OpenMRS 연결 테스트"""
        try:
            result = self._make_request('GET', 'session')
            return {
                'success': True,
                'message': 'OpenMRS 연결 성공',
                'user': result.get('user', {}).get('display', 'Unknown')
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'OpenMRS 연결 실패: {str(e)}'
            }
    
    # === 환자 관련 API ===
    def get_patients(self, query=None, limit=50):
        """환자 목록 조회"""
        # 다양한 파라미터 조합 시도
        try:
            # 첫 번째 시도: 기본 파라미터
            params = {'v': 'default', 'limit': limit}
            if query:
                params['q'] = query
            result = self._make_request('GET', 'patient', params=params)
            return result.get('results', [])
        except:
            try:
                # 두 번째 시도: 간단한 파라미터
                params = {'limit': limit}
                if query:
                    params['q'] = query
                result = self._make_request('GET', 'patient', params=params)
                return result.get('results', [])
            except:
                # 세 번째 시도: 파라미터 없이
                result = self._make_request('GET', 'patient')
                return result.get('results', [])
    
    def get_patient(self, patient_uuid):
        """특정 환자 조회"""
        return self._make_request('GET', f'patient/{patient_uuid}', params={'v': 'full'})
    
    def create_patient(self, patient_data):
        """환자 생성"""
        openmrs_data = self._convert_patient_to_openmrs(patient_data)
        return self._make_request('POST', 'patient', data=openmrs_data)
    
    def update_patient(self, patient_uuid, patient_data):
        """환자 정보 수정"""
        openmrs_data = self._convert_patient_to_openmrs(patient_data)
        return self._make_request('POST', f'patient/{patient_uuid}', data=openmrs_data)
    
    def _convert_patient_to_openmrs(self, patient_data):
        """Django 환자 데이터를 OpenMRS 형식으로 변환"""
        return {
            "identifiers": [{
                "identifier": patient_data.get('patient_id'),
                "identifierType": "05a29f94-c0ed-11e2-94be-8c13b969e334",  # OpenMRS Patient Identifier Type UUID
                "location": "8d6c993e-c2cc-11de-8d13-0010c6dffd0f",  # Unknown Location UUID
                "preferred": True
            }],
            "person": {
                "names": [{
                    "givenName": patient_data.get('name', '').split()[0] if patient_data.get('name') else '',
                    "familyName": patient_data.get('name', '').split()[-1] if patient_data.get('name') else '',
                    "preferred": True
                }],
                "gender": patient_data.get('gender', 'U'),
                "birthdate": patient_data.get('birth_date'),
                "addresses": [{
                    "address1": patient_data.get('address', ''),
                    "preferred": True
                }] if patient_data.get('address') else []
            }
        }
    
    # === 방문 관련 API ===
    def get_visits(self, patient_uuid=None, limit=50):
        """방문 목록 조회"""
        params = {'v': 'default', 'limit': limit}
        if patient_uuid:
            params['patient'] = patient_uuid
        
        result = self._make_request('GET', 'visit', params=params)
        return result.get('results', [])
    
    def get_visit(self, visit_uuid):
        """특정 방문 조회"""
        return self._make_request('GET', f'visit/{visit_uuid}', params={'v': 'full'})
    
    def create_visit(self, visit_data):
        """방문 생성"""
        openmrs_data = self._convert_visit_to_openmrs(visit_data)
        return self._make_request('POST', 'visit', data=openmrs_data)
    
    def _convert_visit_to_openmrs(self, visit_data):
        """Django 방문 데이터를 OpenMRS 형식으로 변환"""
        return {
            "patient": visit_data.get('patient_uuid'),
            "visitType": "7b0f5697-27e3-40c4-8bae-f4049abfb4ed",  # Facility Visit
            "startDatetime": visit_data.get('visit_date'),
            "location": "8d6c993e-c2cc-11de-8d13-0010c6dffd0f"  # Unknown Location
        }
    
    # === 관찰 기록 (Obs) 관련 API ===
    def get_observations(self, patient_uuid=None, concept_uuid=None, limit=50):
        """관찰 기록 조회 (활력징후 등)"""
        params = {'v': 'default', 'limit': limit}
        if patient_uuid:
            params['patient'] = patient_uuid
        if concept_uuid:
            params['concept'] = concept_uuid
        
        result = self._make_request('GET', 'obs', params=params)
        return result.get('results', [])
    
    def create_observation(self, obs_data):
        """관찰 기록 생성"""
        return self._make_request('POST', 'obs', data=obs_data)
    
    # === 개념(Concept) 관련 API ===
    def get_concepts(self, query=None, limit=50):
        """개념 검색"""
        params = {'v': 'default', 'limit': limit}
        if query:
            params['q'] = query
        
        result = self._make_request('GET', 'concept', params=params)
        return result.get('results', [])
    
    def get_concept(self, concept_uuid):
        """특정 개념 조회"""
        return self._make_request('GET', f'concept/{concept_uuid}', params={'v': 'full'})
    
    # === 진료과/부서 관련 API ===
    def get_locations(self):
        """위치/부서 목록 조회"""
        result = self._make_request('GET', 'location', params={'v': 'default'})
        return result.get('results', [])
    
    # === 사용자 관련 API ===
    def get_providers(self):
        """의료진 목록 조회"""
        result = self._make_request('GET', 'provider', params={'v': 'default'})
        return result.get('results', [])


# 싱글톤 인스턴스 생성
openmrs = OpenMRSService()