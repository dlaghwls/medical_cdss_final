# openmrs_integration/management/commands/sync_openmrs_patients.py
from django.core.management.base import BaseCommand
from django.conf import settings
import requests
from requests.auth import HTTPBasicAuth
import uuid
from openmrs_integration.models import OpenMRSPatient 
from datetime import datetime

OPENMRS_API_BASE_URL = getattr(settings, 'OPENMRS_API_BASE_URL', 'http://localhost:8080/openmrs/ws/rest/v1')
OPENMRS_USERNAME = getattr(settings, 'OPENMRS_USERNAME', 'admin')
OPENMRS_PASSWORD = getattr(settings, 'OPENMRS_PASSWORD', 'Admin123')

class Command(BaseCommand):
    help = 'Fetches patient data from OpenMRS and syncs it with the local Django database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit', 
            type=int, 
            default=50, 
            help='Number of patients to fetch in each API call'
        )
        parser.add_argument(
            '--max_patients', 
            type=int, 
            default=1000, 
            help='Maximum number of patients to sync in total (for safety)'
        )
        parser.add_argument(
            '--query', 
            type=str, 
            default='1000', # <--- 기본 검색어를 '1000'으로 변경!
            help='Search query. Defaults to "1000" to fetch patients with identifiers starting with 1000.'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting OpenMRS patient data synchronization...'))

        limit = options['limit']
        max_patients_to_sync = options['max_patients']
        search_query = options['query'] # 사용자가 입력한 query 또는 기본값 '1000'
        
        synced_count = 0
        start_index = 0
        has_more_patients = True

        self.stdout.write(f"Attempting to sync with query: '{search_query}' (limit: {limit}, max_patients: {max_patients_to_sync})")

        while has_more_patients and synced_count < max_patients_to_sync:
            try:
                api_url = f"{OPENMRS_API_BASE_URL}/patient" 
                
                params = {
                    'v': 'full',       
                    'limit': limit,
                    'startIndex': start_index,
                    'q': search_query  # 항상 q 파라미터를 포함 (기본값 '1000' 또는 사용자가 지정한 값)
                }
                
                self.stdout.write(f"Requesting OpenMRS API: {api_url} with params: {params}")
                
                response = requests.get(
                    api_url,
                    params=params,
                    auth=HTTPBasicAuth(OPENMRS_USERNAME, OPENMRS_PASSWORD),
                    headers={'Content-Type': 'application/json', 'Accept': 'application/json'}, 
                    timeout=60 
                )
                
                self.stdout.write(f"OpenMRS API response status: {response.status_code}")
                response.raise_for_status() 
                
                openmrs_response_data = response.json() 
                openmrs_patients_list = openmrs_response_data.get('results', [])

                if not openmrs_patients_list:
                    has_more_patients = False
                    if start_index == 0: 
                        self.stdout.write(self.style.WARNING(f"No patients found in OpenMRS for query '{search_query}' on the first page."))
                    else:
                        self.stdout.write(self.style.WARNING(f"No more patients found in OpenMRS for query '{search_query}' on subsequent pages."))
                    break

                self.stdout.write(f"Fetched {len(openmrs_patients_list)} patients from OpenMRS (startIndex: {start_index}, query: '{search_query}'). Processing...")

                for patient_data in openmrs_patients_list:
                    try:
                        patient_uuid_str = patient_data.get('uuid')
                        if not patient_uuid_str:
                            self.stdout.write(self.style.WARNING(f"Skipping patient data with no UUID: {patient_data.get('display')}"))
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
                                    self.stdout.write(self.style.WARNING(f"Could not parse birthdate string: {birthdate_str} for patient {valid_uuid}"))
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
                        if created:
                            self.stdout.write(self.style.SUCCESS(f"CREATED: Patient {valid_uuid} - {patient_data.get('display')}"))
                        else:
                            self.stdout.write(f"UPDATED: Patient {valid_uuid} - {patient_data.get('display')}")
                        
                        synced_count += 1
                        if synced_count >= max_patients_to_sync:
                            has_more_patients = False
                            self.stdout.write(self.style.WARNING(f"Reached max_patients limit: {max_patients_to_sync}"))
                            break
                    
                    except Exception as db_error:
                        self.stdout.write(self.style.ERROR(f"Error saving/updating patient {patient_data.get('uuid')} to Django DB: {type(db_error).__name__} - {db_error}"))

                if not has_more_patients: 
                    break

                start_index += len(openmrs_patients_list) 
                if len(openmrs_patients_list) < limit: 
                    has_more_patients = False
                    self.stdout.write(self.style.SUCCESS(f"Fetched all available patients for query '{search_query}' as OpenMRS returned fewer than limit."))

            except requests.exceptions.HTTPError as err:
                # ... (이하 에러 처리 로직은 이전과 동일하게 유지) ...
                error_detail = "No response text"
                status_code_info = "Unknown Status"
                reason_info = "Unknown Reason"
                if err.response is not None:
                    error_detail = err.response.text
                    status_code_info = err.response.status_code
                    reason_info = err.response.reason
                self.stdout.write(self.style.ERROR(f"HTTP error fetching patient list from OpenMRS: {status_code_info} {reason_info}"))
                self.stdout.write(self.style.ERROR(f"Detail (first 500 chars): {error_detail[:500]}"))
                has_more_patients = False
            except requests.exceptions.JSONDecodeError as err_json:
                self.stdout.write(self.style.ERROR(f"Failed to parse OpenMRS response as JSON: {err_json}"))
                if 'response' in locals() and hasattr(response, 'text'):
                     self.stdout.write(self.style.ERROR(f"Raw response text (first 500 chars) was: {response.text[:500]}"))
                has_more_patients = False
            except requests.exceptions.RequestException as err:
                self.stdout.write(self.style.ERROR(f"Network error connecting to OpenMRS: {err}"))
                has_more_patients = False
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"An unexpected error occurred: {type(e).__name__} - {e}"))
                has_more_patients = False

        self.stdout.write(self.style.SUCCESS(f"Synchronization finished. Total patients processed/synced: {synced_count}"))