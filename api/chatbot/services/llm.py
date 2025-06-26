import os
from dotenv import load_dotenv
import google.generativeai as genai
from schema import ChatMessageSchema # ChatMessageSchema 임포트

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set!")

genai.configure(api_key=GEMINI_API_KEY)

# 모델을 전역으로 한 번만 초기화합니다.
model = genai.GenerativeModel("gemini-1.5-pro")

def summarize_result(result_text: str) -> str:
    prompt = f"""
너는 의료 데이터를 설명하는 챗봇이야.
아래의 예측 결과를 환자가 이해하기 쉽게 설명해줘.
진단은 하지 말고, 마지막에는 반드시 "정확한 판단은 의료진의 몫입니다."로 끝내.
**답변은 반드시 한국어로 작성해줘.**

예측 결과:
{result_text}
"""
    print("[LLM] summarize_result() 호출됨")
    print("[LLM] Prompt ↓↓↓")
    print(prompt)

    try:
        response = model.generate_content(prompt)
        result = response.text.strip()
        print("[LLM] 응답 ↓↓↓")
        print(result)
        return result
    except Exception as e:
        print("[LLM] 오류 발생:", str(e))
        return "죄송합니다. 응답 생성 중 오류가 발생했습니다."


def answer_question(question: str, history: list[ChatMessageSchema]) -> str:
    print("[LLM] answer_question() 호출됨")
    print("[LLM] Question:", question)
    print("[LLM] Raw History:", history)

    gemini_history = []
    # 시스템 프롬프트 추가 (선택 사항이지만 역할을 명확히 하는 데 도움)
    system_instruction = "너는 환자를 돕는 의료 챗봇이야. 환자의 질문에 쉽게, 친절하게, 그리고 **반드시 한국어로** 대답해줘. 진단은 절대 하지 말고, 필요한 경우 '정확한 판단은 의료진의 몫입니다.' 또는 '의료진과 상담하세요.'와 같은 문구로 마무리해."
    gemini_history.append({"role": "user", "parts": [{"text": system_instruction}]})
    gemini_history.append({"role": "model", "parts": [{"text": "네, 환자분께 도움이 되는 정보를 한국어로 제공해 드리겠습니다. 궁금한 점을 말씀해주세요."}]})


    for msg in history:
        role = "user" if msg.sender == "user" else "model"
        gemini_history.append({"role": role, "parts": [{"text": msg.content}]})

    chat_session = model.start_chat(history=gemini_history)
    
    try:
        response = chat_session.send_message(question)
        result = response.text.strip()
        print("[LLM] 응답 ↓↓↓")
        print(result)
        return result
    except Exception as e:
        print("[LLM] 오류 발생:", str(e))
        return "죄송합니다. 챗봇 응답 생성 중 문제가 발생했습니다."

