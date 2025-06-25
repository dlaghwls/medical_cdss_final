from schema import (
    InitChatRequest,
    InitChatResponse,
    ChatReplyRequest,
    ChatReplyResponse,
    SessionDetailResponse,
    SessionListResponse,
    ChatMessageSchema,
    ChatSessionSchema,
    GeneAIResultSchema # GeneAIResultSchema 임포트 확인
)
from db.session import SessionLocal
from db.chatbot import ChatSession, ChatMessage
from db.gene import GeneAIResult
from db.openmrs_patient import OpenMRSPatientSQL
from services.llm import summarize_result, answer_question
from datetime import datetime
import uuid
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.orm import joinedload
from typing import List # Python 3.8 이하를 지원해야 한다면 이 임포트를 유지합니다.
                        # 하지만 Python 3.9 이상에서는 list[Type] 형태를 선호합니다.


def handle_init_chat(request: InitChatRequest) -> InitChatResponse:
    db = SessionLocal()
    try:
        patient_obj = db.query(OpenMRSPatientSQL).filter(OpenMRSPatientSQL.uuid == request.patient_uuid).first()

        if not patient_obj:
            raise HTTPException(
                status_code=404,
                detail=f"Patient with UUID '{request.patient_uuid}' not found in the database. Please ensure the patient is registered."
            )

        result_text = "지원하지 않는 source_table입니다"
        if request.source_table == "gene_ai_result":
            gene_result = db.query(GeneAIResult).filter(
                GeneAIResult.id == request.source_id,
                GeneAIResult.patient_id == patient_obj.uuid
            ).first()

            if gene_result:
                result_text = gene_result.result_text
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Gene AI result with ID {request.source_id} for patient {request.patient_uuid} not found."
                )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported source_table: {request.source_table}"
            )

        try:
            summary = summarize_result(result_text)
        except Exception as e:
            print(f"LLM API 호출 오류 (summarize_result): {e}")
            summary = "요약 기능을 사용할 수 없습니다. " + result_text
            
        session = ChatSession(
            session_id=uuid.uuid4(),
            patient_id=patient_obj.uuid,
            source_table=request.source_table,
            source_id=request.source_id,
            created_at=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        message = ChatMessage(
            message_id=uuid.uuid4(),
            session_id=session.session_id,
            sender="bot",
            content=summary,
            sent_at=datetime.utcnow()
        )
        db.add(message)
        db.commit()
        db.refresh(message)

        return InitChatResponse(session_id=session.session_id, message=summary)
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"An unexpected error occurred in handle_init_chat: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
    finally:
        db.close()


def handle_chat_reply(request: ChatReplyRequest) -> ChatReplyResponse:
    db = SessionLocal()
    try:
        # 1. 유저 메시지 저장
        session = db.query(ChatSession).filter(ChatSession.session_id == request.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail=f"Chat session with ID {request.session_id} not found.")

        user_msg = ChatMessage(
            message_id=uuid.uuid4(),
            session_id=request.session_id,
            sender="user",
            content=request.user_message,
            sent_at=datetime.utcnow()
        )
        db.add(user_msg)
        db.commit()
        db.refresh(user_msg)

        # 2. LLM 응답 생성: 이전 대화 기록을 context로 함께 전달
        try:
            # 현재 세션의 모든 대화 기록을 가져옵니다.
            # 가장 오래된 메시지부터 최신 메시지 순으로 정렬합니다.
            messages = db.query(ChatMessage).filter(ChatMessage.session_id == request.session_id).order_by(ChatMessage.sent_at).all()
            
            # answer_question 함수에 user_message와 전체 대화 기록을 전달합니다.
            bot_response = answer_question(request.user_message, history=messages)
        except Exception as e:
            print(f"LLM API 호출 오류 (answer_question): {e}")
            bot_response = "죄송합니다. 현재 질문에 답변하는 데 문제가 발생했습니다."


        # 3. 챗봇 응답 저장
        bot_msg = ChatMessage(
            message_id=uuid.uuid4(),
            session_id=request.session_id,
            sender="bot",
            content=bot_response,
            sent_at=datetime.utcnow()
        )
        db.add(bot_msg)
        db.commit()
        db.refresh(bot_msg)

        return ChatReplyResponse(message=bot_response)
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"An unexpected error occurred in handle_chat_reply: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
    finally:
        db.close()


def get_session_messages(session_id: UUID) -> SessionDetailResponse:
    db = SessionLocal()
    try:
        session = (
            db.query(ChatSession)
            .options(joinedload(ChatSession.patient))
            .filter(ChatSession.session_id == session_id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail=f"Chat session with ID {session_id} not found.")

        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.sent_at)
            .all()
        )
        
        patient_display_name = session.patient.display_name if session.patient else None
        
        return SessionDetailResponse(
            session_id=session_id,
            patient_uuid=session.patient_id,
            patient_display_name=patient_display_name,
            messages=[
                ChatMessageSchema(
                    sender=m.sender,
                    content=m.content,
                    sent_at=m.sent_at
                ) for m in messages
            ]
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"An unexpected error occurred in get_session_messages: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
    finally:
        db.close()


def get_sessions_by_patient_uuid(patient_uuid: UUID) -> SessionListResponse:
    db = SessionLocal()
    try:
        patient_obj = db.query(OpenMRSPatientSQL).filter(OpenMRSPatientSQL.uuid == patient_uuid).first()
        if not patient_obj:
            raise HTTPException(status_code=404, detail=f"Patient with UUID '{patient_uuid}' not found.")

        sessions = (
            db.query(ChatSession)
            .options(joinedload(ChatSession.patient))
            .filter(ChatSession.patient_id == patient_uuid)
            .order_by(ChatSession.created_at.desc())
            .all()
        )
        
        return SessionListResponse(
            sessions=[
                ChatSessionSchema(
                    session_id=s.session_id,
                    patient_uuid=s.patient_id,
                    patient_display_name=s.patient.display_name if s.patient else None,
                    source_table=s.source_table,
                    source_id=s.source_id,
                    created_at=s.created_at
                ) for s in sessions
            ]
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"An unexpected error occurred in get_sessions_by_patient_uuid: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
    finally:
        db.close()

def get_gene_ai_results_for_patient(patient_uuid: UUID) -> list[GeneAIResultSchema]: # List -> list로 변경
    db = SessionLocal()
    try:
        # 먼저 해당 patient_uuid를 가진 OpenMRSPatient가 존재하는지 확인 (선택 사항이지만 데이터 일관성 유지에 좋음)
        patient_obj = db.query(OpenMRSPatientSQL).filter(OpenMRSPatientSQL.uuid == patient_uuid).first()
        if not patient_obj:
            raise HTTPException(status_code=404, detail=f"Patient with UUID '{patient_uuid}' not found.")

        # 해당 환자의 모든 GeneAIResult를 created_at 역순으로 가져옴 (최신 결과가 먼저 오도록)
        results = (
            db.query(GeneAIResult)
            .filter(GeneAIResult.patient_id == patient_uuid)
            .order_by(GeneAIResult.created_at.desc())
            .all()
        )

        # 스키마에 맞춰 변환
        return [
            GeneAIResultSchema(
                id=str(r.id), # UUID는 문자열로 변환하여 스키마에 맞춥니다.
                patient_id=str(r.patient_id),
                confidence_score=r.confidence_score,
                model_name=r.model_name,
                model_version=r.model_version,
                result_text=r.result_text,
                created_at=r.created_at
            ) for r in results
        ]
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"An unexpected error occurred in get_gene_ai_results_for_patient: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
    finally:
        db.close()
