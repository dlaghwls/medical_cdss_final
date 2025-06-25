# medical_cdss-happy/backend/medical_cdss/medical_cdss/settings.py

import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import timedelta # 6-19 추교상 로그인
# 6월 16일 Flutter 관련
# # 🔧 이미지 업로드 관련 설정 추가
# MEDIA_URL = '/media/'
# MEDIA_ROOT = BASE_DIR / 'media'  # 이미지가 저장되는 폴더 경로

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent  # 변경 후 추가 (6/13)
dotenv_path = BASE_DIR / '.env' 
# load_dotenv(dotenv_path=dotenv_path) # 변경 전 기존 경로 (6/13)
load_dotenv(dotenv_path=ROOT_DIR / ".env")  
print(f"DEBUG: Attempting to load .env from: {dotenv_path}")

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key-fallback')
DEBUG_ENV = os.getenv('DEBUG', 'True')
DEBUG = DEBUG_ENV.lower() == 'true'

ALLOWED_HOSTS_ENV = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0,*,django-backend,medical-django-backend')
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_ENV.split(',')]
# AUTH_USER_MODEL = 'accounts.User' # 2025/06/18 - 12:04 유정우가 추가함 
AUTH_USER_MODEL = 'accounts.User' # 6-19 추교상 로그인
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'openmrs_integration',
    'django_celery_beat',

    'rest_framework',
    'rest_framework_simplejwt', # 6-19 추교상 로그인
    'rest_framework.authtoken', # TokenAuthentication 사용 시 필요 (기존 유지)
    'corsheaders',

    # Local apps (기존에 있었던 앱들만 유지)
    'patients',
    'visits',
    'diagnoses',
    'cdss',
    'ml_models',
    'lab_results',
    'chat', # 메시지 기능이 불안정할 수 있지만, 앱은 유지 (만약 chat 앱도 없었다면 제거)
    'pacs',
    'labs', # lab 기능_김태빈 작업
    'accounts.apps.AccountsConfig', # 유정우가 2025/06/18 09:17에 다시 추가함
    'chatbot',
    'vitals', # 유정우 vital 작업 추가 
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'medical_cdss.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'medical_cdss.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'medical_cdss_fallback_db'),
        'USER': os.getenv('DB_USER', 'postgres_fallback_user'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres_fallback_pw'),
        'HOST': os.getenv('DB_HOST', 'postgres_fallback_host'),
        'PORT': os.getenv('DB_PORT', '5432_fallback_port'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# AUTH_USER_MODEL = 'core.User' # 이 줄은 계속 주석 처리 또는 제거

LANGUAGE_CODE = 'ko-kr'
TIME_ZONE = 'Asia/Seoul'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
        

    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': int(os.getenv('DRF_PAGE_SIZE', '20')),
}

# 6-19 추교상 Simple JWT 설정 추가
from datetime import timedelta # 이 줄이 파일 상단에 이미 없다면 추가해야 합니다.
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60), # Access 토큰 유효 시간
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),   # Refresh 토큰 유효 시간
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY, # settings.py의 SECRET_KEY 사용
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,

    'AUTH_HEADER_TYPES': ('Bearer', 'Token'), # 'Token'도 포함하여 기존 obtain_auth_token 뷰도 지원 가능
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'employee_id', # User 모델의 기본 키 필드
    'USER_ID_CLAIM': 'employee_id', # 토큰 페이로드에 사용자 ID를 저장할 클레임 이름 (employee_id)

    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',

    'JTI_CLAIM': 'jti',

    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
    
    # 커스텀 토큰 발급 Serializer 설정 (accounts.serializers.MyTokenObtainPairSerializer)
    # 이 시리얼라이저를 accounts/serializers.py에 직접 정의해야 합니다.
    'TOKEN_OBTAIN_SERIALIZER': 'accounts.serializers.MyTokenObtainPairSerializer', 
    'TOKEN_REFRESH_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenRefreshSerializer',
    'TOKEN_VERIFY_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenVerifySerializer',
    'TOKEN_BLACKLIST_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenBlacklistSerializer',
    'TOKEN_SLIDING_OBTAIN_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenObtainSlidingSerializer',
    'TOKEN_SLIDING_REFRESH_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenRefreshSlidingSerializer',
}

CORS_ALLOW_ALL_ORIGINS = os.getenv('CORS_ALLOW_ALL_ORIGINS', 'True').lower() == 'true'
CORS_ALLOW_CREDENTIALS = True

# 🔧 CORS 설정 수정 - 3001 포트 추가
# CORS_ALLOWED_ORIGINS_ENV = os.getenv('CORS_ALLOWED_ORIGINS', "http://localhost:3000,http://127.0.0.1:3000,http://0.0.0.0:3000,http://34.64.188.9:3001,http://medical-react-frontend:3000,http://react-frontend:3000")
# CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_ENV.split(',')]
CORS_ALLOW_ALL_ORIGINS = True #유정우넌할수있어 잠시설정해놈
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type', 'dnt',
    'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
    'cache-control', 'pragma', 'if-modified-since',
]
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
CORS_PREFLIGHT_MAX_AGE = int(os.getenv('CORS_PREFLIGHT_MAX_AGE', '86400'))

# 🔧 CSRF 설정 수정 - 3001 포트 추가
CSRF_TRUSTED_ORIGINS_ENV = os.getenv('CSRF_TRUSTED_ORIGINS', "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000,http://34.64.188.9:3001")
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in CSRF_TRUSTED_ORIGINS_ENV.split(',')]

# 🔧 OpenMRS 설정 수정 - 변수명 일치시킴
OPENMRS_BASE_URL = os.getenv('OPENMRS_BASE_URL', 'http://openmrs-backend-app:8080/openmrs')
OPENMRS_API_PATH = os.getenv('OPENMRS_API_PATH', '/ws/rest/v1')
OPENMRS_USERNAME = os.getenv('OPENMRS_USERNAME', 'admin_fallback')
OPENMRS_PASSWORD = os.getenv('OPENMRS_PASSWORD', 'Admin123_fallback')

# 🔧 수정: _ENV 제거하고 위에서 정의한 변수 사용
OPENMRS_API_BASE_URL = f"{OPENMRS_BASE_URL.rstrip('/')}{OPENMRS_API_PATH.rstrip('/')}"

DEFAULT_OPENMRS_SYNC_QUERY = os.getenv('DEFAULT_OPENMRS_SYNC_QUERY', '1000')
OPENMRS_PATIENT_LIST_DEFAULT_LIMIT = int(os.getenv('OPENMRS_PATIENT_LIST_DEFAULT_LIMIT', '50'))

DEFAULT_OPENMRS_IDENTIFIER_TYPE_UUID = os.getenv('DEFAULT_OPENMRS_IDENTIFIER_TYPE_UUID', "FALLBACK_IDENTIFIER_TYPE_UUID_ERROR")
DEFAULT_OPENMRS_LOCATION_UUID = os.getenv('DEFAULT_OPENMRS_LOCATION_UUID', "44c3efb0-2583-4c80-a79e-1f756a03c0a1")
OPENMRS_PHONE_ATTRIBUTE_TYPE_UUID = os.getenv('OPENMRS_PHONE_ATTRIBUTE_TYPE_UUID', "FALLBACK_PHONE_ATTR_UUID_ERROR")

ORTHANC_URL = os.getenv('ORTHANC_URL', 'http://serene_diffie:8042')
ORTHANC_PUBLIC_URL = os.getenv('ORTHANC_PUBLIC_URL', 'http://localhost:8042')
ORTHANC_USERNAME = os.getenv('ORTHANC_USERNAME', 'orthanc')
ORTHANC_PASSWORD = os.getenv('ORTHANC_PASSWORD', 'orthanc')

# 두 번째 파일에만 있던 GCS 설정 추가
GCS_BUCKET_NAME = os.getenv('GCS_BUCKET_NAME', 'default-fallback-bucket-name') # 유정우넌할수있어

# VitalSigns 관련 Concept/Encounter Type UUID 설정은 제거

print("--- Django Settings Initialized (OpenMRS Configuration) ---")
print(f"BASE_DIR: {BASE_DIR}")
print(f"Loaded .env from: {dotenv_path} (Exists: {os.path.exists(dotenv_path)})")
print(f"SECRET_KEY Loaded: {'Yes' if SECRET_KEY != 'django-insecure-default-key-fallback' else 'No, using fallback'}")
print(f"DEBUG: {DEBUG} (from env: '{DEBUG_ENV}')")
print(f"ALLOWED_HOSTS: {ALLOWED_HOSTS} (from env: '{ALLOWED_HOSTS_ENV}')")
print(f"DB_NAME: {DATABASES['default']['NAME']} (Host: {DATABASES['default']['HOST']})")

# 🔧 수정: 정의된 변수명으로 로깅
print(f"OPENMRS_BASE_URL: '{OPENMRS_BASE_URL}'")
print(f"OPENMRS_API_PATH: '{OPENMRS_API_PATH}'")
print(f"OPENMRS_USERNAME: '{OPENMRS_USERNAME}'")
print(f"OPENMRS_API_BASE_URL (calculated): '{OPENMRS_API_BASE_URL}'")
print(f"DEFAULT_OPENMRS_IDENTIFIER_TYPE_UUID: '{DEFAULT_OPENMRS_IDENTIFIER_TYPE_UUID}'")
print(f"DEFAULT_OPENMRS_LOCATION_UUID: '{DEFAULT_OPENMRS_LOCATION_UUID}'")
print(f"OPENMRS_PHONE_ATTRIBUTE_TYPE_UUID: '{OPENMRS_PHONE_ATTRIBUTE_TYPE_UUID}'")
# print(f"AUTH_USER_MODEL: '{AUTH_USER_MODEL}'") # 이 로깅 줄도 삭제하거나 주석 처리
print("------------------------------------------------------------")
print(f"ORTHANC_URL: '{ORTHANC_URL}' (from env: '{os.getenv('ORTHANC_URL', 'Not set, using default')}')")
print(f"ORTHANC_USERNAME: '{ORTHANC_USERNAME}'")

CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://redis_fallback:6379/0')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://redis_fallback:6379/0')
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_ENABLE_UTC = True

CELERY_TASK_ROUTES = {
    'ml_models.tasks.predict_complications_task': {'queue': 'ml_predictions'},
    'ml_models.tasks.predict_stroke_mortality_task': {'queue': 'ml_predictions'},
    'ml_models.tasks.assess_sod2_status_task': {'queue': 'maintenance'},
    'ml_models.tasks.cleanup_old_tasks': {'queue': 'maintenance'},
}

CELERY_BEAT_SCHEDULE = {
    'cleanup-old-tasks': {
        'task': 'ml_models.tasks.cleanup_old_tasks',
        'schedule': 86400.0,
    },
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple' if DEBUG else 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG', # INFO -> DEBUG로 변경
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'pacs': { # 'pacs' 앱의 로깅 레벨 설정
            'handlers': ['console'],
            'level': 'DEBUG', # 이전에 이미 DEBUG로 변경하셨다면 그대로 둡니다.
            'propagate': False,
        },
        'openmrs_integration': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'ml_models': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'celery': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        }
    },
}
# gene model API
GENE_INFERENCE_API = os.environ.get('GENE_INFERENCE_API', 'http://gene_inference:8002/predict_csv')