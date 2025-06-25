from datetime import datetime
from django.utils import timezone
from patients.models import Patient, Visit, VitalSigns
from .openmrs_service import openmrs
import logging

logger = logging.getLogger(__name__)

class OpenMRSSync:
    """OpenMRS와 Django 데이터 동기화"""
    
    def sync_patients_from_openmrs(self, limit=100):
        """OpenMRS에서 환자 데이터 가져와서 Django에 저장"""
        try:
            patients = openmrs.get_patients(limit=limit)
            synced_count = 0
            
            for patient_data in patients:
                try:
                    django_patient = self._convert_openmrs_patient_to_django(patient_data)
                    if django_patient:
                        synced_count += 1
                        logger.info(f"환자 동기화 완료: {django_patient.name}")
                except Exception as e:
                    logger.error(f"환자 동기화 실패: {str(e)}")
                    continue
            
            return {
                'success': True,
                'message': f'{synced_count}명의 환자 동기화 완료',
                'synced_count': synced_count
            }
            
        except Exception as e:
            logger.error(f"환자 동기화 오류: {str(e)}")
            return {
                'success': False,
                'message': f'환자 동기화 실패: {str(e)}'
            }
    
    def _convert_openmrs_patient_to_django(self, openmrs_patient):
        """OpenMRS 환자 데이터를 Django 모델로 변환"""
        try:
            # OpenMRS UUID
            openmrs_uuid = openmrs_patient.get('uuid')
            
            # 기본 정보 추출
            person = openmrs_patient.get('person', {})
            
            # 이름 추출
            names = person.get('names', [])
            name = ''
            if names:
                given_name = names[0].get('givenName', '')
                family_name = names[0].get('familyName', '')
                name = f"{family_name}{given_name}".strip()
            
            # 식별자 추출 (환자번호)
            identifiers = openmrs_patient.get('identifiers', [])
            patient_id = identifiers[0].get('identifier', '') if identifiers else ''
            
            # 생년월일 추출
            birthdate_str = person.get('birthdate')
            birth_date = None
            if birthdate_str:
                try:
                    birth_date = datetime.strptime(birthdate_str[:10], '%Y-%m-%d').date()
                except:
                    pass
            
            # 성별 추출
            gender = person.get('gender', 'U')
            
            # 주소 추출
            addresses = person.get('addresses', [])
            address = addresses[0].get('address1', '') if addresses else ''
            
            # Django 환자 객체 생성 또는 업데이트
            patient, created = Patient.objects.update_or_create(
                openmrs_patient_id=openmrs_uuid,
                defaults={
                    'patient_id': patient_id or f'AUTO_{openmrs_uuid[:8]}',
                    'name': name or 'Unknown',
                    'birth_date': birth_date or timezone.now().date(),
                    'gender': gender,
                    'address': address,
                }
            )
            
            return patient
            
        except Exception as e:
            logger.error(f"OpenMRS 환자 변환 실패: {str(e)}")
            return None
    
    def sync_visits_from_openmrs(self, patient=None, limit=100):
        """OpenMRS에서 방문 데이터 가져와서 Django에 저장"""
        try:
            # 특정 환자의 방문만 가져오기
            patient_uuid = patient.openmrs_patient_id if patient else None
            visits = openmrs.get_visits(patient_uuid=patient_uuid, limit=limit)
            
            synced_count = 0
            
            for visit_data in visits:
                try:
                    django_visit = self._convert_openmrs_visit_to_django(visit_data)
                    if django_visit:
                        synced_count += 1
                        logger.info(f"방문 동기화 완료: {django_visit.visit_number}")
                except Exception as e:
                    logger.error(f"방문 동기화 실패: {str(e)}")
                    continue
            
            return {
                'success': True,
                'message': f'{synced_count}개의 방문 동기화 완료',
                'synced_count': synced_count
            }
            
        except Exception as e:
            logger.error(f"방문 동기화 오류: {str(e)}")
            return {
                'success': False,
                'message': f'방문 동기화 실패: {str(e)}'
            }
    
    def _convert_openmrs_visit_to_django(self, openmrs_visit):
        """OpenMRS 방문 데이터를 Django 모델로 변환"""
        try:
            # OpenMRS UUID
            openmrs_uuid = openmrs_visit.get('uuid')
            
            # 환자 찾기
            patient_uuid = openmrs_visit.get('patient', {}).get('uuid')
            try:
                patient = Patient.objects.get(openmrs_patient_id=patient_uuid)
            except Patient.DoesNotExist:
                logger.warning(f"환자를 찾을 수 없음: {patient_uuid}")
                return None
            
            # 방문 일시
            start_datetime_str = openmrs_visit.get('startDatetime')
            visit_date = timezone.now()
            if start_datetime_str:
                try:
                    visit_date = datetime.strptime(start_datetime_str, '%Y-%m-%dT%H:%M:%S.%f%z')
                except:
                    try:
                        visit_date = datetime.strptime(start_datetime_str[:19], '%Y-%m-%dT%H:%M:%S')
                        visit_date = timezone.make_aware(visit_date)
                    except:
                        pass
            
            # 방문 유형
            visit_type = openmrs_visit.get('visitType', {}).get('display', 'OUTPATIENT')
            if 'inpatient' in visit_type.lower():
                visit_type = 'INPATIENT'
            elif 'emergency' in visit_type.lower():
                visit_type = 'EMERGENCY'
            else:
                visit_type = 'OUTPATIENT'
            
            # Django 방문 객체 생성 또는 업데이트
            visit, created = Visit.objects.update_or_create(
                openmrs_visit_id=openmrs_uuid,
                defaults={
                    'patient': patient,
                    'visit_number': f'V{openmrs_uuid[:8]}',
                    'visit_type': visit_type,
                    'status': 'COMPLETED',
                    'visit_date': visit_date,
                }
            )
            
            return visit
            
        except Exception as e:
            logger.error(f"OpenMRS 방문 변환 실패: {str(e)}")
            return None
    
    def push_patient_to_openmrs(self, patient):
        """Django 환자를 OpenMRS로 전송"""
        try:
            patient_data = {
                'patient_id': patient.patient_id,
                'name': patient.name,
                'birth_date': patient.birth_date.isoformat() if patient.birth_date else None,
                'gender': patient.gender,
                'address': patient.address,
            }
            
            if patient.openmrs_patient_id:
                # 업데이트
                result = openmrs.update_patient(patient.openmrs_patient_id, patient_data)
            else:
                # 새로 생성
                result = openmrs.create_patient(patient_data)
                if result.get('uuid'):
                    patient.openmrs_patient_id = result['uuid']
                    patient.save()
            
            return {
                'success': True,
                'message': 'OpenMRS 환자 동기화 완료',
                'openmrs_uuid': result.get('uuid')
            }
            
        except Exception as e:
            logger.error(f"OpenMRS 환자 전송 실패: {str(e)}")
            return {
                'success': False,
                'message': f'OpenMRS 환자 전송 실패: {str(e)}'
            }
    
    def push_visit_to_openmrs(self, visit):
        """Django 방문을 OpenMRS로 전송"""
        try:
            if not visit.patient.openmrs_patient_id:
                return {
                    'success': False,
                    'message': '환자의 OpenMRS ID가 없습니다'
                }
            
            visit_data = {
                'patient_uuid': visit.patient.openmrs_patient_id,
                'visit_date': visit.visit_date.isoformat(),
            }
            
            result = openmrs.create_visit(visit_data)
            if result.get('uuid'):
                visit.openmrs_visit_id = result['uuid']
                visit.save()
            
            return {
                'success': True,
                'message': 'OpenMRS 방문 동기화 완료',
                'openmrs_uuid': result.get('uuid')
            }
            
        except Exception as e:
            logger.error(f"OpenMRS 방문 전송 실패: {str(e)}")
            return {
                'success': False,
                'message': f'OpenMRS 방문 전송 실패: {str(e)}'
            }


# 싱글톤 인스턴스 생성
sync = OpenMRSSync()