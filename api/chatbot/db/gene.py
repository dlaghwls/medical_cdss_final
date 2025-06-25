# FastAPI 전용 모델 정의 파일
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship 
import uuid
from datetime import datetime 

from .session import Base

from .openmrs_patient import OpenMRSPatientSQL

class GeneAIResult(Base):
    __tablename__ = "ml_models_geneairesult"  # 실제 DB 테이블명 그대로

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    patient_id = Column(UUID(as_uuid=True), ForeignKey("openmrs_integration_openmrspatient.uuid"), nullable=False)
    
    confidence_score = Column(Float)
    model_name = Column(String)
    model_version = Column(String) 
    result_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow) 

    patient = relationship("OpenMRSPatientSQL", back_populates="gene_ai_results")

