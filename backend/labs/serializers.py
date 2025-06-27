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
    # 추가: 환자의 display_name을 읽기 전용 필드로 추가
    patient_display_name = serializers.CharField(source='patient.display_name', read_only=True)
    # 추가: 검사 종류의 이름(name)을 읽기 전용 필드로 추가
    test_type_display_name = serializers.CharField(source='test_type.name', read_only=True)

    class Meta:
        model = LabOrder
        fields = '__all__'
        # read_only_fields에 추가: display_name 필드들은 생성/업데이트 시 입력되지 않음
        read_only_fields = ['id', 'created_at', 'patient_display_name', 'test_type_display_name']


class LabResultSerializer(serializers.ModelSerializer):
    # LabOrder의 patient_display_name을 읽기 전용으로 가져옴
    patient_display_name = serializers.CharField(source='lab_order.patient.display_name', read_only=True)
    # LabOrder의 test_type_display_name을 읽기 전용으로 가져옴
    test_type_display_name = serializers.CharField(source='lab_order.test_type.name', read_only=True)
    # test_item의 name과 unit을 읽기 전용으로 가져옴
    test_item_name = serializers.CharField(source='test_item.name', read_only=True)
    test_item_unit = serializers.CharField(source='test_item.unit', read_only=True)
    # test_item의 ref_low와 ref_high를 읽기 전용으로 가져옴
    test_item_ref_low = serializers.CharField(source='test_item.ref_low', read_only=True)
    test_item_ref_high = serializers.CharField(source='test_item.ref_high', read_only=True)
    # LabOrder의 reported_at을 가져옴 (LabResult에는 reported_at 직접 없음)
    reported_at = serializers.DateTimeField(source='lab_order.reported_at', read_only=True)


    class Meta:
        model = LabResult
        fields = '__all__'
        # read_only_fields에 추가: id 및 위에서 추가한 display 필드들
        read_only_fields = [
            'id', 'patient_display_name', 'test_type_display_name',
            'test_item_name', 'test_item_unit', 'reported_at'
        ]


