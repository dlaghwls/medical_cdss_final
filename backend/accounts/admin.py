import django.contrib.admin as admin 
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    """
    커스텀 User 모델을 위한 Admin 설정입니다.
    기본 BaseUserAdmin을 상속받아 필요한 필드를 추가하거나 변경합니다.
    """
    list_display = (
        'employee_id', 'name', 'department', 'role',
        'is_staff', 'is_active', 'date_joined', 'openmrs_uuid' # openmrs_uuid 추가
    )
    search_fields = ('employee_id', 'name', 'department', 'openmrs_uuid')
    list_filter = ('is_staff', 'is_active', 'role', 'department')

    ordering = ('employee_id',)

    fieldsets = (
        (None, {'fields': ('employee_id', 'password')}),
        ('개인 정보', {'fields': ('name', 'department', 'role', 'openmrs_uuid')}), # openmrs_uuid 추가
        ('권한', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('중요 날짜', {'fields': ('last_login', 'date_joined')}), # last_login과 date_joined는 Read-only 필드로 분류
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('employee_id', 'password', 'name', 'department', 'role', 'openmrs_uuid'), # 새로운 유저 생성 시 UUID를 수동으로 입력하려면 추가
        }),
    )


    readonly_fields = ('date_joined', 'last_login')


    # filter_horizontal은 UserAdmin에서 자동으로 처리되는 m2m 필드에 사용됩니다.
    # 만약 User 모델에 새로운 m2m 필드를 추가하지 않았다면 별도로 정의할 필요는 없습니다.
    # filter_horizontal = ('groups', 'user_permissions',) # 필요한 경우 주석 해제하여 사용