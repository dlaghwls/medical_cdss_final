FROM python:3.11

WORKDIR /app

ENV PYTHONPATH=/app:$PYTHONPATH 

COPY requirements.txt .

# 유정우 제발 정신차려 (작동 굿)
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip show django-cors-headers && \
    echo "✅ pip install 단계 완료"

COPY . .

# COPY ../frontend/src/data/feature_columns.json /frontend/src/data/feature_columns.json
# COPY ./shared_data/feature_columns.json /shared_data/feature_columns.json
EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]