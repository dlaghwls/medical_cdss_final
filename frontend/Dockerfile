# 1. 빌더 스테이지: 애플리케이션 의존성 설치 및 기본 설정
FROM node:18 AS builder

WORKDIR /app

# package.json 및 lock 파일 복사 (의존성 캐싱을 위해 먼저 복사)
COPY package.json ./
# COPY package-lock.json ./ 250621 유정우가 수정 도커 빌드가 안되서 

# 의존성 설치
# npm install --force는 시간이 오래 걸릴 수 있으므로,
# node_modules 볼륨이 제대로 작동하면 이 단계는 빌드 시에만 필요합니다.
RUN npm install --force

# ⭐⭐⭐ 이 줄을 삭제하거나 주석 처리합니다. ⭐⭐⭐
# COPY . . 

# 개발 서버를 직접 실행하는 명령어로 교체합니다.
EXPOSE 3000
CMD ["npm", "start"] 


