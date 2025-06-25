# openmrs_integration/models.py
from django.db import models
from django.conf import settings
import uuid

class OpenMRSPatient(models.Model):
    uuid = models.UUIDField(primary_key=True, editable=False, help_text="OpenMRS Patient UUID")
    display_name = models.CharField(max_length=255, blank=True, null=True, help_text="Patient's full name or display name")
    identifier = models.CharField(max_length=100, blank=True, null=True, unique=True, help_text="Primary OpenMRS ID")
    given_name = models.CharField(max_length=100, blank=True, null=True)
    family_name = models.CharField(max_length=100, blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    birthdate = models.DateField(blank=True, null=True)
    raw_openmrs_data = models.JSONField(blank=True, null=True, help_text="Raw patient data from OpenMRS as JSON")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    pacs_id = models.CharField(max_length=255, blank=True, null=True, help_text="PACS Patient ID (e.g., Orthanc ID or DICOM PatientID)")

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        to_field='openmrs_uuid', # account/User 모델의 'openmrs_uuid' 필드를 참조(위의 UUID와 별개)
        db_column='user_openmrs_uuid', 
        related_name='openmrs_patient_record', # related_name 충돌 방지
        null=True,
        blank=True,
        help_text="연결된 User 계정 (환자)의 OpenMRS UUID"
    )
        
    def __str__(self):
        return self.display_name or str(self.uuid)

    class Meta:
        verbose_name = "OpenMRS Patient Record"
        verbose_name_plural = "OpenMRS Patient Records"
        ordering = ['family_name', 'given_name']
