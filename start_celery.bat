@echo off
echo Starting Redis server...
docker run -d --name medical-redis -p 6379:6379 redis:7-alpine

echo Waiting for Redis to start...
timeout /t 3

echo Starting Celery Worker...
start "Celery Worker" cmd /k "cd backend && celery -A medical_cdss worker -l info -P eventlet"

echo Starting Celery Beat...
start "Celery Beat" cmd /k "cd backend && celery -A medical_cdss beat -l info"

echo Starting Flower Monitor...
start "Flower" cmd /k "cd backend && celery -A medical_cdss flower --port=5555"

echo All Celery services started!
echo Worker: http://localhost:5555 (Flower)
echo Redis: localhost:6379
pause
