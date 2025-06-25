@echo off
echo ========================================
echo  의료 CDSS Celery 서비스 정지
echo ========================================

:: Celery 프로세스 종료
echo [1/3] Celery 프로세스 종료 중...
taskkill /f /im celery.exe 2>nul
taskkill /f /im python.exe /fi "WINDOWTITLE eq Celery*" 2>nul

:: Redis 컨테이너 정지
echo [2/3] Redis 컨테이너 정지 중...
docker stop medical-redis 2>nul
docker rm medical-redis 2>nul

:: 정리 완료
echo [3/3] 정리 완료!
echo.
echo ========================================
echo  모든 Celery 서비스가 정지되었습니다.
echo ========================================
pause