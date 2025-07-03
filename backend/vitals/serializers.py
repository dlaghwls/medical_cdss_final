from rest_framework import serializers
from .models import VitalSession, VitalMeasurement
# [수정] Patient 모델 대신 OpenMRSPatient 모델을 가져옵니다.
from openmrs_integration.models import OpenMRSPatient

class VitalMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = VitalMeasurement
        exclude = ('session',)

class VitalSessionSerializer(serializers.ModelSerializer):
    measurements = VitalMeasurementSerializer(write_only=True)
    patient = serializers.UUIDField(write_only=True)

    class Meta:
        model = VitalSession
        fields = ('session_id', 'patient', 'measurements', 'notes', 'recorded_at')
        read_only_fields = ('session_id',)

    def create(self, validated_data):
        measurements_data = validated_data.pop('measurements')
        patient_uuid = validated_data.pop('patient')

        try:
            # [수정] OpenMRSPatient 모델에서, 'uuid' 필드로 환자를 찾습니다.
            patient_instance = OpenMRSPatient.objects.get(uuid=patient_uuid)
        except OpenMRSPatient.DoesNotExist:
            raise serializers.ValidationError(f"Patient with uuid {patient_uuid} not found. Please sync data first.")

        vital_session = VitalSession.objects.create(patient=patient_instance, **validated_data)
        VitalMeasurement.objects.create(session=vital_session, **measurements_data)
        
        return vital_session
# 추교상넌할수있어
# class VitalSessionSerializer(serializers.ModelSerializer):
#     measurements = VitalMeasurementSerializer(write_only=True)
#     patient = serializers.UUIDField(write_only=True)

#     class Meta:
#         model = VitalSession
#         # ✅ 'summary' 필드를 읽기 전용에서 제외하여 생성 시 값을 쓸 수 있도록 합니다.
#         fields = ('session_id', 'patient', 'measurements', 'notes', 'recorded_at', 'summary')
#         read_only_fields = ('session_id',)

#     def create(self, validated_data):
#         measurements_data = validated_data.pop('measurements')
#         patient_uuid = validated_data.pop('patient')

#         try:
#             patient_instance = OpenMRSPatient.objects.get(uuid=patient_uuid)
#         except OpenMRSPatient.DoesNotExist:
#             raise serializers.ValidationError(f"Patient with uuid {patient_uuid} not found.")

#         # ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
#         # ✅✅✅ 1. summary 문자열을 생성하는 로직 추가 ✅✅✅
#         # ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
#         summary_parts = []
#         # measurements_data 딕셔너리를 순회하며 문자열 생성
#         if measurements_data.get('bp'):
#             summary_parts.append(f"BP: {measurements_data.get('bp')}")
#         if measurements_data.get('hr'):
#             summary_parts.append(f"HR: {measurements_data.get('hr')}")
#         if measurements_data.get('rr'):
#             summary_parts.append(f"RR: {measurements_data.get('rr')}")
#         if measurements_data.get('temp'):
#             summary_parts.append(f"Temp: {measurements_data.get('temp')}")
#         if measurements_data.get('spo2'):
#             summary_parts.append(f"SpO2: {measurements_data.get('spo2')}")
        
#         # 생성된 문자열을 validated_data에 추가
#         validated_data['summary'] = ', '.join(summary_parts)
#         # ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

#         vital_session = VitalSession.objects.create(patient=patient_instance, **validated_data)
#         VitalMeasurement.objects.create(session=vital_session, **measurements_data)
        
#         return vital_session
# 목록 및 그래프    
# 읽기 전용으로, 관계된 측정값까지 함께 보여주는 Serializer
class VitalMeasurementReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = VitalMeasurement
        fields = '__all__'

class VitalSessionReadSerializer(serializers.ModelSerializer):
    # models.py에 설정한 related_name='measurements'를 사용하여
    # 세션에 연결된 측정값 객체를 가져옵니다.
    measurements = VitalMeasurementReadSerializer(read_only=True)

    class Meta:
        model = VitalSession
        fields = '__all__' # 모든 필드를 포함하여 출력