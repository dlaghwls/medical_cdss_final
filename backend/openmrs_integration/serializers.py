# backend/openmrs_integration/serializers.py

from rest_framework import serializers
from .models import OpenMRSPatient

class OpenMRSPatientSerializer(serializers.ModelSerializer):
    # pacs_id 필드를 identifier에 매핑 (프론트엔드에서 pacs_id를 요청할 때 identifier 값을 반환)
    pacs_id = serializers.CharField(source='identifier', read_only=True) 
    display = serializers.CharField(source='display_name', read_only=True)
    
    class Meta:
        model = OpenMRSPatient
        fields = [
            'uuid', 
            'identifier', 
            'pacs_id',
            'display', 
            'display_name',
            'given_name',
            'family_name',
            'gender',
            'birthdate',
            'raw_openmrs_data'
        ]
    def get_display(self, obj):
        """display 필드 값을 생성하는 메서드"""
        return obj.display_name or f"{obj.given_name or ''} {obj.family_name or ''}".strip() or f"Patient (UUID: {str(obj.uuid)[:8]})"
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # raw_openmrs_data에서 추가 필드 추출
        raw_data = instance.raw_openmrs_data or {}
        data.update({
            'identifiers': raw_data.get('identifiers', []),
            'person': raw_data.get('person', {}),
            'display': data.get('display_name')  # display 필드 호환성 추가
        })
        return data