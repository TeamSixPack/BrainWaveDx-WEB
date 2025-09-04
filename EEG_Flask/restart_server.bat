@echo off
echo [RESTART] Flask 서버 재시작 중...
echo [RESTART] 기존 프로세스 종료 중...

REM 기존 Python 프로세스 종료
taskkill /f /im python.exe 2>nul
taskkill /f /im pythonw.exe 2>nul

echo [RESTART] 3초 대기 중...
timeout /t 3 /nobreak >nul

echo [RESTART] Flask 서버 시작 중...
cd /d "%~dp0"
python app.py

pause
