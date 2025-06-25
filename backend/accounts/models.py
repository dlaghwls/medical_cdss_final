# /app/backend/accounts/models.py

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid as uuid_lib

class UserManager(BaseUserManager):
    def create_user(self, employee_id, password=None, **extra_fields):
        if not employee_id:
            raise ValueError('The Employee ID must be set')
        
        # 'role' 설정 로직을 이곳으로 일원화합니다.
        # Serializer에서 'role'을 보내지 않으므로 여기서 값을 설정합니다.
        if 'role' not in extra_fields:
            role_prefix = employee_id.split('-')[0].upper()
            if role_prefix == 'DOC':
                extra_fields['role'] = 'doctor'
            elif role_prefix == 'NUR':
                extra_fields['role'] = 'nurse'
            elif role_prefix == 'PAT':
                extra_fields['role'] = 'patient'
            elif role_prefix == 'TEC':
                # 'technician'을 모델에 정의된 올바른 값 'tec'으로 수정합니다.
                extra_fields['role'] = 'tec' 
            else:
                # 올바른 접두사가 없으면 에러를 발생시켜 잘못된 데이터 생성을 막습니다.
                raise ValueError('Invalid employee_id prefix. Cannot determine role.')

        # Serializer로부터 'openmrs_uuid'라는 이름으로 받은 값을 처리합니다.
        openmrs_uuid_data = extra_fields.pop('openmrs_uuid', None)

        # email 필드가 User 모델에 없으므로 extra_fields에서 제거합니다.
        extra_fields.pop('email', None)

        user = self.model(
            employee_id=employee_id,
            openmrs_uuid=openmrs_uuid_data,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, employee_id, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'doctor') # 슈퍼유저는 기본 역할을 지정 (예: doctor)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(employee_id, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        DOCTOR = 'doctor', '의사'
        NURSE = 'nurse', '간호사'
        PATIENT = 'patient', '환자'
        TECHNICIAN = 'tec', '기술자'

    employee_id = models.CharField(max_length=20, unique=True, primary_key=True, verbose_name='사원번호')
    name = models.CharField(max_length=100, verbose_name='이름')
    department = models.CharField(max_length=100, verbose_name='부서', blank=True, null=True) 
    role = models.CharField(max_length=10, choices=Role.choices, verbose_name='직무')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    openmrs_uuid = models.CharField(max_length=36, unique=True, null=True, blank=True, verbose_name='OpenMRS 환자 UUID')
    date_joined = models.DateTimeField(auto_now_add=True)

    # 이름 충돌 방지를 위한 related_name 추가
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name="custom_user_groups"
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="custom_user_permissions"
    )

    objects = UserManager()
    USERNAME_FIELD = 'employee_id'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.employee_id