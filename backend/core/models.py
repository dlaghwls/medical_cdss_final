# medical_cdss-happy/backend/core/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser # Django 기본 사용자 모델 확장
import uuid # UUID 필드를 위해

class User(AbstractUser):
    # Django의 기본 'id' 필드 외에, 고유 식별자 및 프론트엔드 요구사항을 위한 UUID 필드를 추가합니다.
    # AUTH_USER_MODEL로 지정될 때 primary_key는 아니지만, 고유한 식별자로 사용됩니다.
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    
    # 의료진의 역할 (예: 'doctor', 'nurse', 'technician')을 저장합니다.
    role = models.CharField(max_length=50, blank=True, null=True)
    
    # 프론트엔드 UI에 표시될 이름 (예: '홍길동 의사')
    display = models.CharField(max_length=255, blank=True, null=True)

    # 부서 정보 추가 (프론트엔드 user 객체에 department가 있었으므로)
    department = models.CharField(max_length=100, blank=True, null=True)

    # AbstractUser가 기본 username, email, first_name, last_name, password 등을 제공합니다.

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        # Django에게 이 모델이 'core' 앱에 속함을 명시적으로 알려줍니다.
        # 이 줄이 있어야 AUTH_USER_MODEL = 'core.User'가 정상 작동합니다.
        app_label = 'core' 

    def save(self, *args, **kwargs):
        # display 필드가 비어있으면 first_name과 last_name으로 채우거나 username으로 채움
        if not self.display and self.first_name and self.last_name:
            self.display = f"{self.first_name} {self.last_name}"
        elif not self.display and self.username:
            self.display = self.username
        super().save(*args, **kwargs)

    def __str__(self):
        return self.display if self.display else self.username

# DRF TokenAuthentication을 위한 Token 모델 연결
# 새로운 User가 생성될 때 자동으로 Token을 생성하는 시그널.
# 이 코드는 core/models.py에 User 모델 정의와 함께 있어야 합니다.
from rest_framework.authtoken.models import Token
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)