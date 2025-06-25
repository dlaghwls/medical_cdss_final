from django.core.management.base import BaseCommand, CommandError
from core.openmrs_sync import sync
from patients.models import Patient

class Command(BaseCommand):
    help = 'OpenMRS와 Django 데이터를 동기화합니다'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--patients',
            action='store_true',
            help='환자 데이터를 OpenMRS에서 가져옵니다',
        )
        parser.add_argument(
            '--visits',
            action='store_true',
            help='방문 데이터를 OpenMRS에서 가져옵니다',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='모든 데이터를 동기화합니다',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=50,
            help='가져올 데이터 수 제한 (기본값: 50)',
        )
        parser.add_argument(
            '--push-patient',
            type=str,
            help='특정 환자를 OpenMRS로 전송 (환자번호)',
        )
    
    def handle(self, *args, **options):
        limit = options['limit']
        
        # 특정 환자를 OpenMRS로 전송
        if options['push_patient']:
            self.push_patient_to_openmrs(options['push_patient'])
            return
        
        # 환자 데이터 동기화
        if options['patients'] or options['all']:
            self.sync_patients(limit)
        
        # 방문 데이터 동기화
        if options['visits'] or options['all']:
            self.sync_visits(limit)
        
        # 옵션이 없으면 도움말 표시
        if not any([options['patients'], options['visits'], options['all']]):
            self.stdout.write(
                self.style.WARNING('동기화할 데이터 유형을 선택하세요:')
            )
            self.stdout.write('  --patients: 환자 데이터 동기화')
            self.stdout.write('  --visits: 방문 데이터 동기화')
            self.stdout.write('  --all: 모든 데이터 동기화')
            self.stdout.write('  --push-patient [환자번호]: 환자를 OpenMRS로 전송')
    
    def sync_patients(self, limit):
        """환자 데이터 동기화"""
        self.stdout.write('OpenMRS에서 환자 데이터 동기화 시작...')
        
        try:
            result = sync.sync_patients_from_openmrs(limit=limit)
            
            if result['success']:
                self.stdout.write(
                    self.style.SUCCESS(f"✅ {result['message']}")
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f"❌ {result['message']}")
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ 환자 동기화 중 오류: {str(e)}")
            )
    
    def sync_visits(self, limit):
        """방문 데이터 동기화"""
        self.stdout.write('OpenMRS에서 방문 데이터 동기화 시작...')
        
        try:
            result = sync.sync_visits_from_openmrs(limit=limit)
            
            if result['success']:
                self.stdout.write(
                    self.style.SUCCESS(f"✅ {result['message']}")
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f"❌ {result['message']}")
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ 방문 동기화 중 오류: {str(e)}")
            )
    
    def push_patient_to_openmrs(self, patient_id):
        """Django 환자를 OpenMRS로 전송"""
        self.stdout.write(f'환자 {patient_id}를 OpenMRS로 전송 중...')
        
        try:
            patient = Patient.objects.get(patient_id=patient_id)
            result = sync.push_patient_to_openmrs(patient)
            
            if result['success']:
                self.stdout.write(
                    self.style.SUCCESS(f"✅ {result['message']}")
                )
                if result.get('openmrs_uuid'):
                    self.stdout.write(f"OpenMRS UUID: {result['openmrs_uuid']}")
            else:
                self.stdout.write(
                    self.style.ERROR(f"❌ {result['message']}")
                )
                
        except Patient.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f"❌ 환자 '{patient_id}'를 찾을 수 없습니다")
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ 환자 전송 중 오류: {str(e)}")
            )