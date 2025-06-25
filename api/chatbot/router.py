from fastapi import APIRouter, Query # Query 임포트
from uuid import UUID
from schema import (
    InitChatRequest,
    InitChatResponse,
    ChatReplyRequest,
    ChatReplyResponse,
    SessionDetailResponse,
    SessionListResponse,
    ChatMessageSchema,
    ChatSessionSchema,
    GeneAIResultSchema  
)
from controller import (
    handle_init_chat,
    handle_chat_reply,
    get_session_messages,
    get_sessions_by_patient_uuid,
    get_gene_ai_results_for_patient 
)

router = APIRouter()

@router.post("/init", response_model=InitChatResponse)
def init_chat(request: InitChatRequest):
    return handle_init_chat(request)

@router.post("/reply", response_model=ChatReplyResponse)
def reply_chat(request: ChatReplyRequest):
    return handle_chat_reply(request)

@router.get("/session/{session_id}", response_model=SessionDetailResponse)
def get_session(session_id: UUID):
    return get_session_messages(session_id)

@router.get("/sessions", response_model=SessionListResponse)
def list_sessions(patient_uuid: UUID = Query(..., description="UUID of the patient to list sessions for")):
    return get_sessions_by_patient_uuid(patient_uuid)

@router.get("/latest-id")
def get_latest_source_id(
    patient_uuid: UUID = Query(...),
    source_table: str = Query(...)
):
    from db.session import SessionLocal
    from db.gene import GeneAIResult
    # from db.?? import ?? # 향후 다른 테이블도 확장 가능
    db = SessionLocal()

    if source_table == "gene_ai_result":
        result = (
            db.query(GeneAIResult)
            .filter(GeneAIResult.patient_id == patient_uuid)
            .order_by(GeneAIResult.created_at.desc())
            .first()
        )
    else:
        return {"detail": "Unsupported source_table"}, 400

    if result is None:
        return {"detail": "No result found"}, 404

    return {"source_id": result.id}

@router.get("/gene-ai-results/{patient_uuid}", response_model=list[GeneAIResultSchema])
def get_patient_gene_ai_results(patient_uuid: UUID):
    """
    특정 환자의 모든 유전자 AI 결과 목록을 가져옵니다.
    """
    return get_gene_ai_results_for_patient(patient_uuid)


