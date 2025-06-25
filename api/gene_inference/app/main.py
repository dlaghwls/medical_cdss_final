from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from .inference import (
    load_model,
    predict,
    predict_batch,
    GeneVector
)
import pandas as pd
from fastapi.responses import JSONResponse
import os
import uuid
from datetime import datetime

# CORSMiddleware 
from fastapi.middleware.cors import CORSMiddleware 

# SQLAlchemy 관련 임포트
from sqlalchemy import create_engine, Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as SQL_UUID # SQLAlchemy의 UUID 타입
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

DATABASE_URL = os.getenv("DATABASE_URL") 

# DATABASE_URL이 설정되지 않았을 경우를 대비한 오류 처리 (선택 사항)
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set for gene_api.")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency: Get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Django 모델에 대응하는 SQLAlchemy 모델 정의
class OpenMRSPatientSQL(Base):
    __tablename__ = "openmrs_integration_openmrspatient" # 실제 DB 테이블명
    uuid = Column(SQL_UUID(as_uuid=True), primary_key=True)
    identifier = Column(String(100), unique=True, nullable=True)
    display_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class GeneAIResultSQL(Base):
    __tablename__ = "ml_models_geneairesult" # 실제 DB 테이블명
    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(SQL_UUID(as_uuid=True), ForeignKey("openmrs_integration_openmrspatient.uuid"), nullable=False)
    confidence_score = Column(Float)
    model_name = Column(String(128))
    model_version = Column(String(32), nullable=True)
    result_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    patient = relationship("OpenMRSPatientSQL", backref="gene_ai_results_sql")


INPUT_DIM = 18631
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pt")
try:
    model = load_model(MODEL_PATH, input_dim=INPUT_DIM)
    print("INFO gene 모델 로드 성공")
except Exception as e:
    print(f"ERROR gene 모델 로드 실패: {e}")
    model = None

app = FastAPI()

origins = [
    "http://34.64.188.9:3001",  # 프런트엔드가 서비스되는 실제 주소
    "http://localhost:3000",   # 개발 환경을 위한 로컬호스트 주소 (필요시)
    "http://34.64.188.9:8000",  # Django 백엔드 주소 (FastAPI가 Django와 연동될 경우 필요)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # 허용할 출처 목록
    allow_credentials=True,      # 자격 증명 허용 (쿠키, HTTP 인증 등)
    allow_methods=["*"],         # 모든 HTTP 메서드 허용
    allow_headers=["*"],         # 모든 헤더 허용
)

@app.get("/")
async def root():
    if model is None:
        return {"message": "Gene Inference API is running but ML model failed to load.", "status": "error"}
    return {"message": "Gene Inference API is running and ML model loaded successfully.", "status": "ok"}

@app.post("/predict")
async def predict_endpoint(item: GeneVector):
    if model is None:
        raise HTTPException(status_code=503, detail="ML model is not loaded.")
    result = predict(model, item.gene_vector)
    return {"result": result}

@app.post("/predict_csv")
async def predict_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if model is None:
        raise HTTPException(status_code=503, detail="ML model is not loaded.")

    contents = await file.read()
    from io import BytesIO

    df = pd.read_csv(BytesIO(contents))

    if "patient_id" not in df.columns or df["patient_id"].empty:
        raise HTTPException(status_code=400, detail="CSV must contain a 'patient_id' column representing the patient's UUID.")
    
    try:
        patient_uuid_from_csv = uuid.UUID(str(df["patient_id"].iloc[0]))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid 'patient_id' format in CSV. Must be a valid UUID.")

    columns_to_drop = [col for col in ["Label", "patient_id"] if col in df.columns]
    gene_vectors = df.drop(columns=columns_to_drop).fillna(0).values.tolist()

    if not gene_vectors:
        raise HTTPException(status_code=400, detail="No gene vectors found after preprocessing CSV.")
    if len(gene_vectors) > 1:
        raise HTTPException(status_code=400, detail="Batch prediction for multiple patients in one CSV is not supported for database storage. Please submit one patient per CSV.")

    preds = predict_batch(model, gene_vectors)
    prob = preds[0]

    try:
        # 1. OpenMRSPatient 객체 조회 (UUID로 직접 검색)
        patient_obj = db.query(OpenMRSPatientSQL).filter(OpenMRSPatientSQL.uuid == patient_uuid_from_csv).first()

        # ***** 변경된 부분: 환자가 없을 경우 에러 반환 *****
        if not patient_obj:
            raise HTTPException(
                status_code=404,
                detail=f"Patient with UUID '{patient_uuid_from_csv}' not found in the database. Please ensure the patient is registered."
            )
        # *************************************************

        # 2. geneAIResult 객체 생성 및 저장
        ai_result = GeneAIResultSQL(
            patient_id=patient_obj.uuid, # OpenMRSPatient의 UUID를 ForeignKey로 연결
            confidence_score=float(prob),
            model_name="AETransformerLite",
            model_version="v1.0",
            result_text=f"뇌졸중일 확률은 {round(prob*100, 1)}%입니다.",
        )
        db.add(ai_result)
        db.commit()
        db.refresh(ai_result)

        result_response = {
            "gene_ai_result_id": str(ai_result.id),
            "patient_uuid": str(patient_uuid_from_csv),
            "prediction_probability": prob,
            "model_name": "AETransformerLite",
            "model_version": "v1.0",
            "result_text": ai_result.result_text
        }
        return JSONResponse(content=result_response)

    except HTTPException as e:
        db.rollback()
        raise e # 직접 발생시킨 HTTPException은 그대로 전달
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to save AI result to database: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")