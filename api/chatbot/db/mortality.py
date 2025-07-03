# /home/shared/medical_cdss/api/chatbot/db/mortality.py

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID as SQL_UUID
from .session import Base
import uuid
from datetime import datetime

class StrokeMortalityPrediction(Base):
    # Django의 ml_models_strokemortalityprediction 테이블과 연결
    __tablename__ = 'ml_models_strokemortalityprediction'

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(SQL_UUID(as_uuid=True), ForeignKey('openmrs_integration_openmrspatient.uuid'))
    
    # Django 모델의 필드명과 Flutter에서 사용하는 필드명을 매칭
    mortality_rate = Column("mortality_30_day", Float)
    risk_level = Column("mortality_30_day_risk_level", String)
    created_at = Column(DateTime, default=datetime.utcnow)
