FROM python:3.11-slim

WORKDIR /app

COPY ./api/chatbot/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 나머지 소스 복사
# COPY ./api/chatbot/ .
COPY ./api/chatbot/ /app/

ENV PYTHONPATH=/app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
