# /home/shared/medical_cdss/api/chatbot/db/sod2.py

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID as SQL_UUID
from sqlalchemy.orm import relationship
from .session import Base
import uuid
from datetime import datetime

# PredictionTask 모델은 다른 모델과의 관계를 위해 필요
class PredictionTask(Base):
    __tablename__ = 'ml_models_predictiontask'
    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(SQL_UUID(as_uuid=True), unique=True)
    patient_id = Column(SQL_UUID(as_uuid=True), ForeignKey('openmrs_integration_openmrspatient.uuid'))
    
    # SOD2Assessment와의 관계 설정
    sod2_assessment = relationship("SOD2Assessment", back_populates="task", uselist=False)

class SOD2Assessment(Base):
    # Django의 ml_models_sod2assessment 테이블과 연결
    __tablename__ = 'ml_models_sod2assessment'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(SQL_UUID(as_uuid=True), ForeignKey('ml_models_predictiontask.task_id'))
    
    # Django 모델의 필드명을 Flutter에서 사용하는 필드명에 맞게 매핑
    sod2Level = Column("current_sod2_level", Float)
    stressRisk = Column("oxidative_stress_risk", String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # PredictionTask와의 관계 설정
    task = relationship("PredictionTask", back_populates="sod2_assessment")
