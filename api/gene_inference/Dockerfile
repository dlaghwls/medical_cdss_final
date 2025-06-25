FROM python:3.11 

WORKDIR /app 

# 1. requirements.txt 복사 및 설치
# 빌드 컨텍스트(.)인 /home/shared/medical_cdss 에서 상대 경로를 사용하여 복사
COPY ./api/gene_inference/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r ./requirements.txt

# 2. openmrs_integration 디렉토리 복사 (이제 이게 제대로 작동해야 함)
# 빌드 컨텍스트(.)인 /home/shared/medical_cdss 에서 상대 경로를 사용하여 복사
# COPY ./backend/openmrs_integration /app/openmrs_integration

# 3. gene_inference 앱 코드 복사
# /home/shared/medical_cdss/api/gene_inference/app 디렉토리 전체를 컨테이너의 /app/app으로 복사
COPY ./api/gene_inference/app /app/app

# 4. dummy_gene_vector.csv 파일 복사
# /home/shared/medical_cdss/api/gene_inference/dummy_gene_vector.csv 파일을 컨테이너의 /app/dummy_gene_vector.csv로 복사
# COPY ./api/gene_inference/dummy_gene_vector.csv /app/dummy_gene_vector.csv

# 컨테이너 시작 시 실행될 명령어
# app.main:app 은 /app/app/main.py 를 찾게 됩니다.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]