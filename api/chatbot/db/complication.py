# /home/shared/medical_cdss/api/chatbot/db/complication.py
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship  # relationship 임포트
from .session import Base

class ComplicationPrediction(Base):
    __tablename__ = 'ml_models_complicationprediction'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # [수정] patient_id 대신 task_id를 사용하고 PredictionTask와 관계를 설정합니다.
    task_id = Column(Integer, ForeignKey('ml_models_predictiontask.id'))
    task = relationship("PredictionTask") # JOIN을 위해 관계 설정

    complication_type = Column(String) # Django 모델 필드 이름이 'complication_type'이므로, 'prediction_type'에서 변경하거나 Django 모델을 확인해야 합니다.
    probability = Column(Float)
    risk_level = Column(String)
    # created_at은 이 테이블에 없으므로 삭제하거나, task에서 가져와야 합니다.