from django.contrib import admin
from .models import ChatSession, ChatMessage

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    # 'identifier' 필드는 이제 없습니다. patient__display_name 또는 patient__identifier로 검색합니다.
    list_display = ("session_id", "patient_display_name", "source_table", "created_at")
    search_fields = ("patient__display_name", "patient__identifier", "source_table", "session_id")
    ordering = ("-created_at",)
    actions = ["delete_selected"]
    list_per_page = 50

    # patient_display_name 컬럼을 list_display에 추가하기 위한 메서드
    def patient_display_name(self, obj):
        return obj.patient.display_name if obj.patient else "N/A"
    patient_display_name.short_description = "Patient Name"
    patient_display_name.admin_order_field = 'patient__display_name' # 정렬 가능하게 함


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("message_id", "session", "sender", "sent_at", "short_content") # session 객체 직접 표시
    search_fields = ("session__session_id", "content") # session_id 대신 session__session_id로 외래키 필드 검색
    ordering = ("-sent_at",)
    actions = ["delete_selected"]

    def short_content(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    short_content.short_description = "Content"

