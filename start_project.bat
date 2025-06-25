@echo off
cd /d C:\medical-cdss-project\backend
call venv\Scripts\activate.bat
echo  의료 CDSS 프로젝트 환경 준비 완료
echo  위치: %CD%
echo  Python: %VIRTUAL_ENV%
cmd /k