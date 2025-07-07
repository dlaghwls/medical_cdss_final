# from pydantic import BaseModel
# from uuid import UUID
# from typing import List, Optional # Optional 임포트
# from datetime import datetime

# class InitChatRequest(BaseModel):
#     patient_uuid: UUID # identifier 대신 patient_uuid로 변경
#     source_table: str
#     source_id: UUID


# class InitChatResponse(BaseModel):
#     session_id: UUID
#     message: str

# class ChatReplyRequest(BaseModel):
#     session_id: UUID
#     user_message: str

# class ChatReplyResponse(BaseModel):
#     message: str


# class ChatMessageSchema(BaseModel):
#     sender: str
#     content: str
#     sent_at: datetime
#     # message_id: UUID # 필요하다면 추가


# class ChatSessionSchema(BaseModel):
#     session_id: UUID
#     patient_uuid: UUID # identifier 대신 patient_uuid로 변경
#     patient_display_name: Optional[str] = None # 환자 이름 추가
#     source_table: str
#     source_id: UUID
#     created_at: datetime


# class SessionDetailResponse(BaseModel):
#     session_id: UUID
#     patient_uuid: UUID # 추가
#     patient_display_name: Optional[str] = None # 추가
#     messages: List[ChatMessageSchema]

# class SessionListResponse(BaseModel):
#     sessions: List[ChatSessionSchema]

# class GeneAIResultSchema(BaseModel):
#     id: UUID
#     patient_id: UUID
#     confidence_score: float
#     model_name: str
#     model_version: Optional[str] = None # model_version이 nullable=True이므로 Optional
#     result_text: str
#     created_at: datetime

#     class Config:
#         from_attributes = True # Pydantic v2에서 orm_mode=True 대신 사용

# class AntioxidantResultSchema(BaseModel):
#     id: int
#     patient_id: UUID
#     sod2Level: float
#     stressRisk: str
#     created_at: datetime 

#     class Config:
#         from_attributes = True

# class ComplicationResultSchema(BaseModel):
#     id: int
#     patient_id: UUID
#     complication_type: str
#     probability: float
#     risk_level: str
#     created_at: datetime

#     class Config:
#         from_attributes = True

# class MortalityResultSchema(BaseModel):
#     id: int
#     patient_id: UUID
#     mortality_rate: float
#     risk_level: str
#     created_at: datetime

#     class Config:
#         from_attributes = True

# /home/shared/medical_cdss/api/chatbot/schema.py

from pydantic import BaseModel
from uuid import UUID
from typing import List, Optional
from datetime import datetime

class InitChatRequest(BaseModel):
    patient_uuid: UUID
    source_table: str
    # [수정] source_id를 str로 변경하여 UUID와 int ID를 모두 받을 수 있도록 함
    source_id: str

class InitChatResponse(BaseModel):
    session_id: UUID
    message: str

class ChatReplyRequest(BaseModel):
    session_id: UUID
    user_message: str

class ChatReplyResponse(BaseModel):
    message: str

class ChatMessageSchema(BaseModel):
    sender: str
    content: str
    sent_at: datetime

class ChatSessionSchema(BaseModel):
    session_id: UUID
    patient_uuid: UUID
    patient_display_name: Optional[str] = None
    source_table: str
    # [수정] source_id를 str로 변경
    source_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class SessionDetailResponse(BaseModel):
    session_id: UUID
    patient_uuid: UUID
    patient_display_name: Optional[str] = None
    messages: List[ChatMessageSchema]

class SessionListResponse(BaseModel):
    sessions: List[ChatSessionSchema]

class GeneAIResultSchema(BaseModel):
    id: UUID
    patient_id: UUID
    confidence_score: float
    model_name: str
    model_version: Optional[str] = None
    result_text: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- 새로운 결과물에 대한 스키마 ---

class AntioxidantResultSchema(BaseModel):
    id: int
    sod2Level: float
    stressRisk: str
    # [수정] 필드명을 다른 스키마와 일관성 있게 created_at으로 변경
    created_at: datetime 

    class Config:
        from_attributes = True

class ComplicationResultSchema(BaseModel):
    id: int
    patient_id: UUID
    complication_type: str
    probability: float
    risk_level: str
    created_at: datetime

    class Config:
        from_attributes = True

class MortalityResultSchema(BaseModel):
    id: int
    patient_id: UUID
    mortality_rate: float
    risk_level: str
    created_at: datetime

    class Config:
        from_attributes = True