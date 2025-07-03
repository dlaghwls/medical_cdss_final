# /home/shared/medical_cdss/api/chatbot/db/complication.py

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID as SQL_UUID
from .session import Base
import uuid
from datetime import datetime

class ComplicationPrediction(Base):
    # Django의 ml_models_complicationprediction 테이블과 연결
    __tablename__ = 'ml_models_complicationprediction'
    
    # Django가 자동으로 만드는 id 컬럼을 기본 키로 사용
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Django 모델의 task 필드를 통해 patient_id를 가져와야 하지만,
    # 편의를 위해 DB에 patient_id가 직접 저장된다고 가정합니다.
    # 만약 task를 통해 연결해야 한다면 이 부분의 로직 수정이 필요합니다.
    patient_id = Column(SQL_UUID(as_uuid=True), ForeignKey('openmrs_integration_openmrspatient.uuid'))
    
    complication_type = Column(String)
    probability = Column(Float)
    risk_level = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
