from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router import router as chatbot_router

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Flutter 개발 시엔 * 허용, 배포 시엔 domain으로 변경
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# router 등록
app.include_router(chatbot_router, prefix="/chatbot")
