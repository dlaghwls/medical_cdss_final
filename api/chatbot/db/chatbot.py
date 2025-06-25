from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship # relationship 임포트
import uuid
from datetime import datetime

from .session import Base

from .openmrs_patient import OpenMRSPatientSQL

class ChatSession(Base):
    __tablename__ = "chatbot_chatsession"
    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    patient_id = Column(UUID(as_uuid=True), ForeignKey("openmrs_integration_openmrspatient.uuid"), nullable=False)
    
    source_table = Column(String)
    source_id = Column(UUID(as_uuid=True))
    created_at = Column(DateTime, default=datetime.utcnow)

    # patient 객체와의 관계 설정 (optional, but useful for SQLAlchemy queries)
    patient = relationship("OpenMRSPatientSQL", back_populates="chat_sessions")


class ChatMessage(Base):
    __tablename__ = "chatbot_chatmessage"
    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chatbot_chatsession.session_id"))
    sender = Column(String)
    content = Column(Text)
    sent_at = Column(DateTime, default=datetime.utcnow)

    # ChatSession과의 관계 설정 (optional, but useful for SQLAlchemy queries)
    session = relationship("ChatSession", back_populates="messages")

# ChatSession에 messages 관계 설정
ChatSession.messages = relationship("ChatMessage", order_by=ChatMessage.sent_at, back_populates="session")
