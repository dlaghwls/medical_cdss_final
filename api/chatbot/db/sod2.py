# /home/shared/medical_cdss/api/chatbot/db/sod2.py
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID as SQL_UUID
from sqlalchemy.orm import relationship
from .session import Base

class PredictionTask(Base):
    __tablename__ = 'ml_models_predictiontask'
    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(SQL_UUID(as_uuid=True), unique=True)
    patient_id = Column(SQL_UUID(as_uuid=True), ForeignKey('openmrs_integration_openmrspatient.uuid'))
    created_at = Column(DateTime) # created_at 컬럼 추가
    sod2_assessment = relationship("SOD2Assessment", back_populates="task", uselist=False)

class SOD2Assessment(Base):
    __tablename__ = 'ml_models_sod2assessment'
    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey('ml_models_predictiontask.id'))
    sod2Level = Column("current_sod2_level", Float)
    stressRisk = Column("oxidative_stress_risk", String)
    # [수정] 이 모델에서는 created_at 제거
    
    task = relationship("PredictionTask", back_populates="sod2_assessment")
