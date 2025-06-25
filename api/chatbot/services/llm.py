import os
from dotenv import load_dotenv
import google.generativeai as genai
from schema import ChatMessageSchema

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set!")

genai.configure(api_key=GEMINI_API_KEY)
# model = genai.GenerativeModel("gemini-1.5-pro")
# 모델 초기화는 한 번만 하는 것이 효율적

def summarize_result(result_text: str) -> str:
    prompt = f"""
너는 의료 데이터를 설명하는 챗봇이야.
아래의 예측 결과를 환자가 이해하기 쉽게 설명해줘.
진단은 하지 말고, 마지막에는 반드시 "정확한 판단은 의료진의 몫입니다."로 끝내.

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


def answer_question(question: str, history: list[ChatMessageSchema]) -> str: # history 매개변수 추가 및 타입 힌트
    print("[LLM] answer_question() 호출됨")
    print("[LLM] Question:", question)
    print("[LLM] Raw History:", history)

    # Gemini API가 이해할 수 있는 메시지 형식으로 변환
    # ChatMessageSchema의 sender가 'user'/'bot'으로 되어있다고 가정
    gemini_history = []
    for msg in history:
        # sender를 'user' 또는 'model'(bot에 해당)으로 매핑
        role = "user" if msg.sender == "user" else "model"
        gemini_history.append({"role": role, "parts": [{"text": msg.content}]})

    # Gemini 모델 인스턴스를 다시 가져옵니다.
    # 대화 기록은 모델의 chat 객체에 누적되어야 합니다.
    # 이를 위해 genai.GenerativeModel.start_chat()을 사용합니다.
    model = genai.GenerativeModel("gemini-1.5-pro")
    
    # 기존 대화 기록을 chat 세션에 로드
    chat_session = model.start_chat(history=gemini_history)

    # 새로운 질문에 대한 프롬프트
    # 이미 history가 전달되므로, question만 보내면 됩니다.
    # LLM이 직접 답변을 생성하도록 유도하는 프롬프트를 history에 포함할 수도 있습니다.
    # 여기서는 "의료 상담 챗봇이야"라는 역할을 모델이 이미 인지하고 있다고 가정합니다.
    # 필요 시, history의 첫 부분에 시스템 프롬프트를 추가할 수 있습니다.
    
    # 예시: 시스템 프롬프트를 history에 추가 (선택 사항)
    # system_instruction = "너는 의료 상담 챗봇이야. 환자의 질문에 쉽게, 친절하게 대답해줘. 정확한 진단은 피하고, 필요 시 '의료진과 상담하세요.'로 마무리해."
    # if not gemini_history or gemini_history[0]['role'] != 'system':
    #     gemini_history.insert(0, {'role': 'system', 'parts': [{'text': system_instruction}]})
    
    try:
        # send_message를 사용하여 새로운 메시지를 보내고 응답을 받습니다.
        # 이전에 구성된 chat_session에 메시지가 누적됩니다.
        response = chat_session.send_message(question)
        result = response.text.strip()
        print("[LLM] 응답 ↓↓↓")
        print(result)
        return result
    except Exception as e:
        print("[LLM] 오류 발생:", str(e))
        return "죄송합니다. 챗봇 응답 생성 중 문제가 발생했습니다."


