# backend/lab_results/serializers.py

from rest_framework import serializers
from .models import LabResult, StrokeInfo, Complications
# OpenMRSPatient에 대한 serializer는 필요 없음. display_name만 참조하면 되므로.

class LabResultSerializer(serializers.ModelSerializer):
    # 읽기 전용 필드로 patient의 display_name을 포함하여 결과에 쉽게 접근
    patient_display_name = serializers.CharField(source='patient.display_name', read_only=True)

    class Meta:
        model = LabResult
        fields = ['id', 'patient', 'patient_display_name', 'test_name', 'test_value', 'unit', 'recorded_at', 'notes']
        read_only_fields = ['id', 'recorded_at', 'patient_display_name']
        
class StrokeInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = StrokeInfo
        fields = '__all__' # 모든 필드를 포함

class ComplicationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complications
        fields = '__all__' # 모든 필드를 포함