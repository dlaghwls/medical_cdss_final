# /home/shared/medical_cdss/api/chatbot/db/session.py

import os
from sqlalchemy.orm import sessionmaker, declarative_base # declarative_base 임포트 추가
from sqlalchemy import create_engine

# .env는 docker-compose의 env_file에서 주입됨 → load_dotenv() 생략
DB_NAME = os.getenv("DB_NAME", "medical_cdss")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 5432))

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 필요하다면 여기에 Base.metadata.create_all(engine) 로직을 추가하여
# 애플리케이션 시작 시 자동으로 테이블을 생성하도록 할 수 있습니다.
# (하지만 이미 Django migrations로 테이블이 있다면 필요하지 않을 수 있습니다.)
# from db import chatbot, gene, openmrs_patient # 모든 모델 파일 임포트
# Base.metadata.create_all(engine)
