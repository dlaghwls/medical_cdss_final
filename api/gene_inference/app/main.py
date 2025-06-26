from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form # Form 임포트 추가
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
from sqlalchemy.dialects.postgresql import UUID as SQL_UUID 
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

DATABASE_URL = os.getenv("DATABASE_URL") 

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set for gene_api.")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class OpenMRSPatientSQL(Base):
    __tablename__ = "openmrs_integration_openmrspatient"
    uuid = Column(SQL_UUID(as_uuid=True), primary_key=True)
    identifier = Column(String(100), unique=True, nullable=True)
    display_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class GeneAIResultSQL(Base):
    __tablename__ = "ml_models_geneairesult"
    id = Column(SQL_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # patient_id 컬럼은 OpenMRSPatientSQL 테이블의 uuid를 참조합니다.
    patient_id = Column(SQL_UUID(as_uuid=True), ForeignKey("openmrs_integration_openmrspatient.uuid"), nullable=False)
    confidence_score = Column(Float) # 프론트엔드에서 prediction_probability 대신 confidence_score 사용
    model_name = Column(String(128))
    model_version = Column(String(32), nullable=True)
    result_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow) # created_at 필드 추가
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
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
async def predict_csv(
    file: UploadFile = File(...),
    # ⭐⭐⭐ 변경: patient_uuid를 Form 데이터로 받습니다. ⭐⭐⭐
    patient_uuid: uuid.UUID = Form(...), # FastAPI가 자동으로 UUID 타입으로 변환
    db: Session = Depends(get_db)
):
    if model is None:
        raise HTTPException(status_code=503, detail="ML model is not loaded.")

    contents = await file.read()
    from io import BytesIO

    df = pd.read_csv(BytesIO(contents))

    # ⭐⭐⭐ 변경: CSV 내 patient_id 컬럼 검증 로직 제거 ⭐⭐⭐
    # 대신, 프론트엔드에서 보낸 patient_uuid와 CSV 내 patient_id가 있다면 비교하는 로직 추가
    if "patient_id" in df.columns and not df["patient_id"].empty:
        csv_patient_id = uuid.UUID(str(df["patient_id"].iloc[0]))
        if csv_patient_id != patient_uuid:
            raise HTTPException(
                status_code=400,
                detail=f"Uploaded CSV's patient_id ('{csv_patient_id}') does not match the provided patient_uuid ('{patient_uuid}')."
            )

    columns_to_drop = [col for col in ["Label", "patient_id"] if col in df.columns]
    gene_vectors = df.drop(columns=columns_to_drop).fillna(0).values.tolist()

    if not gene_vectors:
        raise HTTPException(status_code=400, detail="No gene vectors found after preprocessing CSV.")
    if len(gene_vectors) > 1:
        raise HTTPException(status_code=400, detail="Batch prediction for multiple patients in one CSV is not supported for database storage. Please submit one patient per CSV.")

    preds = predict_batch(model, gene_vectors)
    prob = preds[0]

    try:
        # 1. OpenMRSPatient 객체 조회 (FastAPI에서 받은 patient_uuid 사용)
        patient_obj = db.query(OpenMRSPatientSQL).filter(OpenMRSPatientSQL.uuid == patient_uuid).first()

        if not patient_obj:
            raise HTTPException(
                status_code=404,
                detail=f"Patient with UUID '{patient_uuid}' not found in the database. Please ensure the patient is registered."
            )

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
            "patient_uuid": str(patient_uuid), # ⭐⭐⭐ 변경: 프론트엔드에서 받은 patient_uuid 사용 ⭐⭐⭐
            "prediction_probability": prob, # 프론트엔드에서 사용하는 이름 유지
            "model_name": ai_result.model_name, # DB에 저장된 값을 사용
            "model_version": ai_result.model_version, # DB에 저장된 값을 사용
            "result_text": ai_result.result_text, # DB에 저장된 값을 사용
            "created_at": ai_result.created_at.isoformat() # ⭐⭐⭐ 변경: created_at 추가 ⭐⭐⭐
        }
        return JSONResponse(content=result_response)

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to save AI result to database: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")


# 새로운 엔드포인트: 특정 환자의 유전자 분석 기록 조회 
@app.get("/gene_results/{patient_uuid}")
async def get_gene_results(patient_uuid: uuid.UUID, db: Session = Depends(get_db)):
    # patient_id로 필터링하고 created_at으로 정렬 (가장 최신이 마지막에 오도록)
    results = db.query(GeneAIResultSQL).filter(GeneAIResultSQL.patient_id == patient_uuid).order_by(GeneAIResultSQL.created_at).all()
    
    if not results:
        return JSONResponse(content=[], status_code=200) # 결과가 없으면 빈 배열 반환

    response_list = []
    for r in results:
        response_list.append({
            "gene_ai_result_id": str(r.id),
            "patient_uuid": str(r.patient_id), # patient_id가 OpenMRSPatientSQL의 UUID를 참조하므로 그대로 사용
            "prediction_probability": r.confidence_score, # confidence_score로 변경
            "model_name": r.model_name,
            "model_version": r.model_version,
            "result_text": r.result_text,
            "created_at": r.created_at.isoformat() # ISO 8601 형식으로 변환
        })
    
    return JSONResponse(content=response_list)