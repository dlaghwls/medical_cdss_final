from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer 
from .models import User 
import uuid as uuid_lib
import logging

logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True) 
    patient_uuid = serializers.CharField(required=False, allow_null=True, allow_blank=True) 

    class Meta:
        model = User
        fields = ('employee_id', 'name', 'department', 'password', 'password2', 'patient_uuid', 'role')
        extra_kwargs = {
            'password': {'write_only': True},
            # 'role'은 employee_id에 따라 서버에서 결정하므로, 클라이언트로부터 입력을 받지 않도록 설정합니다.
            'role': {'read_only': True} 
        }

    def validate(self, data):
        # 비밀번호 일치 여부 확인
        if data.get('password') != data.get('password2'):
            raise serializers.ValidationError({"password": "두 비밀번호가 일치하지 않습니다."})
        
        employee_id = data.get('employee_id')
        patient_uuid = data.get('patient_uuid')

        # PAT- 사원번호일 때 UUID 유효성 검사
        if employee_id and employee_id.startswith('PAT-'):
            if not patient_uuid:
                raise serializers.ValidationError({"patient_uuid": "PAT- 사원번호의 경우 환자 UUID는 필수입니다."})
            try:
                uuid_lib.UUID(patient_uuid) 
            except ValueError:
                raise serializers.ValidationError({"patient_uuid": "유효하지 않은 UUID 형식입니다."})
        elif patient_uuid: 
            raise serializers.ValidationError({"patient_uuid": "환자 UUID는 PAT- 사원번호에만 허용됩니다."})
            
        return data

    def create(self, validated_data):
        logger.warning(f"UserSerializer.create: Received validated_data - {validated_data}")

        # password와 employee_id는 별도로 처리하므로 먼저 pop 합니다.
        validated_data.pop('password2') 
        password = validated_data.pop('password')
        employee_id = validated_data.pop('employee_id')
        
        openmrs_uuid_value = None
        
        # 사원번호가 'PAT-'로 시작하는지 확인합니다.
        if employee_id.startswith('PAT-'):
            # PAT- 사용자의 경우, patient_uuid 필드에서 UUID 값을 가져옵니다.
            openmrs_uuid_value = validated_data.pop('patient_uuid', None)
            
            # **가장 중요한 부분**: 프론트엔드에서 실수로 department 값을 보냈을 경우를 대비해,
            # PAT- 사용자 생성 시에는 department 필드를 데이터에서 완전히 제거합니다.
            validated_data.pop('department', None)
        
        # 이제 validated_data에는 'name' (그리고 PAT- 사용자가 아닐 경우 'department')만 남아있습니다.
        # 이 정리된 데이터를 create_user로 전달합니다.
        user = User.objects.create_user(
            employee_id=employee_id,
            password=password,
            openmrs_uuid=openmrs_uuid_value, # patient_uuid에서 추출한 값을 openmrs_uuid 인자로 전달
            **validated_data                # 나머지 데이터(name 등)를 전달
        )
        
        logger.warning(f"UserSerializer.create: User created - ID: {user.employee_id}, Name: {user.name}, Department: {user.department}, Role: {user.role}, OpenMRS UUID: {user.openmrs_uuid}")
        return user

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        logger.warning(f"--- MyTokenObtainPairSerializer.get_token 호출됨 ---")
        logger.warning(f"User object received: ID={user.pk}, Employee ID={user.employee_id}, Name={user.name}, Department={user.department}, Role={user.role}, OpenMRS UUID: {user.openmrs_uuid}")

        # super().get_token(user)는 기본적으로 RefreshToken을 반환합니다.
        refresh = super().get_token(user)
        access = refresh.access_token # RefreshToken에서 AccessToken을 얻습니다.

        # 이제 access 토큰에 커스텀 클레임을 추가합니다.
        access['uuid'] = str(user.openmrs_uuid) if user.openmrs_uuid else None
        access['display'] = user.name
        access['name'] = user.name
        access['role'] = user.role

        logger.warning(f"--- Access Token Payload에 정보 추가 시도 완료 ---")
        logger.warning(f"Final Access Token Payload: {access.payload}") # Access 토큰 페이로드 확인
        logger.warning(f"--------------------------------------------")

        return refresh