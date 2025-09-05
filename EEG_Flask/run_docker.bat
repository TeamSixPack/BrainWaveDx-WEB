@echo off
echo EEG Flask 서버 도커 실행 스크립트 (블루투스 접근 가능)
echo =====================================================

REM 기존 컨테이너 정리
echo 기존 컨테이너 정리 중...
docker-compose down

REM 이미지 빌드
echo 도커 이미지 빌드 중...
docker-compose build

REM 컨테이너 실행 (블루투스 접근 권한 포함)
echo 컨테이너 실행 중 (블루투스 접근 권한 포함)...
docker-compose up -d

echo 서버가 실행되었습니다.
echo http://localhost:8000 에서 접속 가능합니다.
echo.
echo 주의: 실제 Muse 2 헤드밴드 사용을 위해서는:
echo 1. Windows에서 Muse 2 헤드밴드를 페어링하세요
echo 2. 블루투스 서비스가 실행 중인지 확인하세요
echo 3. 도커 데스크톱에서 충분한 권한이 부여되었는지 확인하세요

REM 로그 확인
echo.
echo 로그를 확인하려면: docker-compose logs -f
pause
