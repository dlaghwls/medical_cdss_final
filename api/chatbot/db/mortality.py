# /home/shared/medical_cdss/api/chatbot/db/mortality.py
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship  # relationship 임포트
from .session import Base

class StrokeMortalityPrediction(Base):
    __tablename__ = 'ml_models_strokemortalityprediction'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # [수정] Django 모델과 동일하게 task_id를 통해 PredictionTask와 연결합니다.
    task_id = Column(Integer, ForeignKey('ml_models_predictiontask.id'))
    task = relationship("PredictionTask") # JOIN을 위해 관계 설정

    # [수정] 실제 DB 컬럼 이름을 확인하고 매핑해야 합니다.
    # 예: Django 모델의 필드가 'mortality_30_day'라면 아래와 같이 수정
    mortality_rate = Column("mortality_30_day", Float) 
    risk_level = Column("mortality_30_day_risk_level", String)
    
    # [삭제] patient_id와 created_at은 이 테이블에 없으므로 삭제합니다.