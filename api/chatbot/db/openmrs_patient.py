from sqlalchemy import Column, String, DateTime, Date, JSON, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid

from .session import Base

class OpenMRSPatientSQL(Base):
    __tablename__ = "openmrs_integration_openmrspatient"

    uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name = Column(String(255), nullable=True)
    identifier = Column(String(100), unique=True, nullable=True)

    given_name = Column(String(100), nullable=True)
    family_name = Column(String(100), nullable=True)
    gender = Column(String(10), nullable=True)
    birthdate = Column(Date, nullable=True)
    raw_openmrs_data = Column(JSON, nullable=True)
    pacs_id = Column(String(255), nullable=True)

    user_openmrs_uuid = Column(String(36), ForeignKey("accounts_user.openmrs_uuid"), nullable=True, unique=True)


    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship definitions
    chat_sessions = relationship(
        "ChatSession",
        back_populates="patient",
        primaryjoin="OpenMRSPatientSQL.uuid == ChatSession.patient_id"
    )
    gene_ai_results = relationship(
        "GeneAIResult",
        back_populates="patient",
        primaryjoin="OpenMRSPatientSQL.uuid == GeneAIResult.patient_id"
    )
    # user relationship이 이제 user_openmrs_uuid를 통해 연결되도록 합니다.
    user = relationship(
        "UserSQL",
        back_populates="openmrs_patient",
        uselist=False,
        primaryjoin="OpenMRSPatientSQL.user_openmrs_uuid == UserSQL.openmrs_uuid" # JOIN 조건 명시
    )

    def __repr__(self):
        return f"<OpenMRSPatientSQL(uuid='{self.uuid}', identifier='{self.identifier}', user_openmrs_uuid='{self.user_openmrs_uuid}')>"