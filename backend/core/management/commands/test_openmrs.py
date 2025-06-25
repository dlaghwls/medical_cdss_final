from django.core.management.base import BaseCommand
from core.openmrs_service import openmrs

class Command(BaseCommand):
    help = 'OpenMRS 연결 상태를 테스트합니다'
    
    def handle(self, *args, **options):
        self.stdout.write('OpenMRS 연결 테스트 시작...')
        
        try:
            # 연결 테스트
            result = openmrs.test_connection()
            
            if result['success']:
                self.stdout.write(
                    self.style.SUCCESS(f"✅ {result['message']}")
                )
                self.stdout.write(f"로그인 사용자: {result['user']}")
                
                # 추가 정보 조회
                self.stdout.write('\n=== 추가 정보 조회 ===')
                
                # 환자 수 조회
                try:
                    patients = openmrs.get_patients(limit=1)
                    self.stdout.write(f"📊 환자 데이터 접근: 성공")
                    
                    # 특정 환자 UUID로 직접 조회 테스트
                    if patients:
                        patient_uuid = patients[0].get('uuid')
                        if patient_uuid:
                            patient_detail = openmrs.get_patient(patient_uuid)
                            self.stdout.write(f"👤 환자 상세정보 조회: 성공")
                    
                except Exception as e:
                    self.stdout.write(f"❌ 환자 데이터 접근 실패: {str(e)}")
                    
                    # 대안: 환자를 직접 UUID로 조회 시도
                    self.stdout.write("🔄 대안 방법으로 환자 조회 시도...")
                    try:
                        # 알려진 환자 UUID로 직접 조회 (화면에서 본 ID 사용)
                        patient_uuid = "1dd01ccf-9d99-4dc5-9b5d-63ff90d02747"  # URL에서 보인 UUID
                        patient = openmrs.get_patient(patient_uuid)
                        if patient:
                            self.stdout.write(f"✅ 직접 UUID 조회 성공: {patient.get('display', 'Unknown')}")
                    except Exception as e2:
                        self.stdout.write(f"❌ 직접 UUID 조회도 실패: {str(e2)}")
                
                # 방문 수 조회
                try:
                    visits = openmrs.get_visits(limit=1)
                    self.stdout.write(f"📊 방문 데이터 접근: 성공")
                except Exception as e:
                    self.stdout.write(f"❌ 방문 데이터 접근 실패: {str(e)}")
                
                # 위치 정보 조회
                try:
                    locations = openmrs.get_locations()
                    self.stdout.write(f"📍 위치 데이터: {len(locations)}개")
                except Exception as e:
                    self.stdout.write(f"❌ 위치 데이터 접근 실패: {str(e)}")
                
            else:
                self.stdout.write(
                    self.style.ERROR(f"❌ {result['message']}")
                )
                self.stdout.write('연결 설정을 확인하세요:')
                self.stdout.write(f"  - URL: {openmrs.base_url}")
                self.stdout.write(f"  - Username: {openmrs.username}")
                self.stdout.write(f"  - Password: {'*' * len(openmrs.password)}")
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ 연결 테스트 중 오류: {str(e)}")
            )