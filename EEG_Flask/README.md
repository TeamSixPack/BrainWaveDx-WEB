# BrainWaveDx-Flask
EEG 모델 기반 분석 프로젝트 - 딥러닝서버

## 설치 및 설정

### 1. 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. 환경변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# OpenAI API 설정
OPENAI_API_KEY=your_openai_api_key_here

# Flask 설정
FLASK_PORT=8000

# EEG 모델 설정
EEG_WEIGHTS_VER=14
```

**중요**: `.env` 파일은 절대 깃허브에 커밋하지 마세요! 이 파일에는 민감한 API 키가 포함되어 있습니다.

### 3. 서버 실행
```bash
python app.py
```

## API 엔드포인트

- `GET /health`: 서버 상태 확인
- `POST /infer`: EEG 데이터 분석
- `POST /start_eeg_collection`: Muse 2 헤드밴드로 뇌파 데이터 수집
- `POST /check_place`: 장소 판별
- `POST /check_moca_q3`: MoCA Q3 답변 검증
- `POST /check_moca_q4`: MoCA Q4 답변 검증

## 보안 주의사항

- API 키는 반드시 환경변수로 관리하세요
- `.env` 파일을 버전 관리에 포함하지 마세요
- 프로덕션 환경에서는 더욱 강력한 보안 조치를 적용하세요
