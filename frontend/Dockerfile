# # 1. 빌더 스테이지: 애플리케이션 의존성 설치 및 기본 설정
# FROM node:18 AS builder

# WORKDIR /app

# # package.json 및 lock 파일 복사 (의존성 캐싱을 위해 먼저 복사)
# COPY package.json ./
# # COPY package-lock.json ./ 250621 유정우가 수정 도커 빌드가 안되서 

# # 의존성 설치
# # npm install --force는 시간이 오래 걸릴 수 있으므로,
# # node_modules 볼륨이 제대로 작동하면 이 단계는 빌드 시에만 필요합니다.
# RUN npm install --force

# # ⭐⭐⭐ 이 줄을 삭제하거나 주석 처리합니다. ⭐⭐⭐
# # COPY . . 

# # 개발 서버를 직접 실행하는 명령어로 교체합니다.
# EXPOSE 3000
# CMD ["npm", "start"] 

# 이 Dockerfile은 개발 환경에서 React 앱을 컨테이너 내에서 직접 실행하는 데 사용됩니다.
# 프로덕션 배포에는 Nginx와 같은 웹 서버를 사용하는 멀티 스테이지 빌드가 더 효율적입니다.

# Node.js 18 버전 기반의 Alpine 이미지를 사용합니다.
# Alpine 이미지는 경량화되어 컨테이너 크기를 줄이는 데 도움이 됩니다.
FROM node:18-alpine

# 컨테이너 내 작업 디렉토리를 /app으로 설정합니다.
WORKDIR /app

# package.json 및 package-lock.json 파일을 먼저 복사합니다.
# 이는 Node.js 의존성 캐싱을 효율적으로 활용하여 빌드 속도를 높입니다.
COPY package.json ./
# package-lock.json이 있다면 이 줄의 주석을 해제하세요.
# COPY package-lock.json ./

# Node.js 의존성을 설치합니다.
# --force 옵션은 발생할 수 있는 의존성 충돌을 해결하기 위함입니다.
# 이 단계에서 package.json에 명시된 recharts를 포함한 모든 의존성이 설치됩니다.
RUN npm install --force

# 나머지 애플리케이션 소스 코드 전체를 작업 디렉토리로 복사합니다.
# 이 줄은 React 앱의 모든 파일을 컨테이너로 가져오므로 필수입니다.
COPY . .

# React 개발 서버가 기본적으로 사용하는 포트(3000)를 외부에 노출합니다.
EXPOSE 3000

# 컨테이너 시작 시 React 개발 서버를 실행합니다.
# package.json의 "start": "craco start" 스크립트를 사용합니다.
CMD ["npm", "start"]


