from rest_framework import serializers
from .models import LabTestType, LabTestItem, LabOrder, LabResult
from openmrs_integration.models import OpenMRSPatient


class LabTestItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTestItem
        fields = '__all__'


class LabTestTypeSerializer(serializers.ModelSerializer):
    items = LabTestItemSerializer(many=True, read_only=True)

    class Meta:
        model = LabTestType
        fields = ['id', 'name', 'description', 'items']


class LabOrderSerializer(serializers.ModelSerializer):
    # 환자 UUID만 주고받기 위해 PrimaryKeyRelatedField 사용
    patient = serializers.PrimaryKeyRelatedField(queryset=OpenMRSPatient.objects.all())

    class Meta:
        model = LabOrder
        fields = '__all__'


class LabResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabResult
        fields = '__all__'

