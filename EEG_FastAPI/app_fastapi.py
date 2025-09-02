# -*- coding: utf-8 -*-
"""
app_fastapi.py
- FastAPI 서버
- POST /chatbot : 파일 경로(예: ./script.txt) 또는 transcript 문자열을 받아 요약 JSON 응답
- POST /voice-chatbot : 음성 챗봇 전용 - 사용자 답변 분석 및 상담 제공
- ✅ 모델/파라미터 동적 오버라이드 지원
- ✅ /chatbot.do alias 유지 (스프링 호환)
- ✅ 동기 LLM 파이프라인을 스레드로 오프로드하여 이벤트 루프 블로킹 방지
"""

import os
import time
from functools import partial
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from anyio import to_thread

from chabot_model import (
    summarise_from_file,
    run_summarisation_pipeline,
    mark_guide_question_shown,
    analyze_voice_response,  # 새로 추가할 함수
)

app = FastAPI(title="Dementia Chatbot API (FastAPI)")

# CORS 설정 (필요 시 도메인 제한)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # 특정 도메인만 허용하려면 ["https://`도메인`.com"] 처럼 지정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# 요청 스키마
# -------------------------------
class ChatbotRequest(BaseModel):
    file_path: Optional[str] = None
    transcript: Optional[str] = None
    guide_question_index: int = Field(default=3, ge=0, le=3)
    session_id: Optional[str] = Field(default="rest-session-1")

    # 모델/파라미터 오버라이드
    chat_model: Optional[str] = None
    embed_model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    models: Optional[Dict[str, str]] = None  # {"summary": "...", "judge": "...", ...}

class VoiceChatbotRequest(BaseModel):
    user_response: str = Field(..., description="사용자의 음성 답변 텍스트")
    question_context: Optional[str] = Field(default="", description="질문 맥락 (예: '자주 쓰던 물건 이름이 갑자기 생각안 난적이 있나요?')")
    session_id: Optional[str] = Field(default="voice-session-1")
    user_id: Optional[str] = Field(default="", description="사용자 ID")
    
    # 모델/파라미터 오버라이드
    chat_model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None

# -------------------------------
# 헬스 체크
# -------------------------------
@app.get("/healthz")
async def healthz():
    return {"status": "ok", "time": time.time()}

# -------------------------------
# 음성 챗봇 전용 처리 루틴
# -------------------------------
async def _handle_voice_chatbot(payload: VoiceChatbotRequest):
    """음성 챗봇 전용 처리 - 사용자 답변 분석 및 상담 제공"""
    try:
        # 오버라이드 수집
        overrides: Dict[str, Any] = {
            "chat_model": payload.chat_model,
            "temperature": payload.temperature,
            "max_tokens": payload.max_tokens,
        }
        
        # 음성 응답 분석 (동기 함수를 스레드로 오프로드)
        fn = partial(
            analyze_voice_response,
            user_response=payload.user_response,
            question_context=payload.question_context,
            session_id=payload.session_id,
            user_id=payload.user_id,
            **overrides,
        )
        
        result = await to_thread.run_sync(fn)
        return result
        
    except Exception as e:
        print(f"음성 챗봇 처리 오류: {e}")
        raise HTTPException(status_code=500, detail=f"음성 챗봇 처리 중 오류가 발생했습니다: {str(e)}")

# -------------------------------
# 핵심 처리 루틴
# -------------------------------
async def _handle_chatbot(payload: ChatbotRequest):
    # 오버라이드 수집
    overrides: Dict[str, Any] = {
        "chat_model": payload.chat_model,
        "embed_model": payload.embed_model,
        "temperature": payload.temperature,
        "max_tokens": payload.max_tokens,
        "models": payload.models if isinstance(payload.models, dict) else None,
    }

    # 기본: 파일 우선 → 없으면 transcript → 모두 없으면 ./script.txt
    file_path = payload.file_path
    transcript = payload.transcript

    if not file_path and not transcript:
        default_fp = "./script.txt"
        if os.path.exists(default_fp):
            file_path = default_fp
        else:
            raise HTTPException(status_code=400, detail="file_path 또는 transcript가 필요합니다.")

    # 실제 처리 (동기 함수를 스레드로 오프로드)
    if file_path:
        try:
            fn = partial(
                summarise_from_file,
                file_path=file_path,
                guide_question_index=payload.guide_question_index,
                session_id=payload.session_id,
                **overrides,
            )
            result = await to_thread.run_sync(fn)
        except FileNotFoundError as e:
            raise HTTPException(status_code=404, detail=str(e))
    else:
        # 스프링 흐름 상: 가이드 질문을 이미 제시했다고 간주
        mark_guide_question_shown(payload.session_id)
        if not transcript or not transcript.strip():
            raise HTTPException(status_code=400, detail="transcript가 비어 있습니다.")
        try:
            fn = partial(
                run_summarisation_pipeline,
                transcript=transcript.strip(),
                guide_question_index=payload.guide_question_index,
                session_id=payload.session_id,
                **overrides,
            )
            result = await to_thread.run_sync(fn)
        except FileNotFoundError as e:
            raise HTTPException(status_code=404, detail=str(e))

    return result

# -------------------------------
# 엔드포인트
# -------------------------------
@app.post("/voice-chatbot")
async def voice_chatbot(payload: VoiceChatbotRequest):
    """음성 챗봇 전용 엔드포인트 - 사용자 답변 분석 및 상담 제공"""
    try:
        result = await _handle_voice_chatbot(payload)
        return JSONResponse(content=result, status_code=200)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chatbot")
async def chatbot(payload: ChatbotRequest):
    try:
        result = await _handle_chatbot(payload)
        return JSONResponse(content=result, status_code=200)
    except HTTPException:
        raise
    except ValueError as e:
        # chabot_model에서 허용되지 않은 모델명 등으로 ValueError를 던지는 경우 400 처리
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # 디버깅 필요 시 에러 로깅 추가 가능
        raise HTTPException(status_code=500, detail=str(e))

# 스프링 호환 alias
@app.post("/chatbot.do")
async def chatbot_do(payload: ChatbotRequest):
    return await chatbot(payload)

# -------------------------------
# 로컬 실행
# -------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))  # 8000에서 8001로 변경
    uvicorn.run("app_fastapi:app", host="0.0.0.0", port=port, reload=False)
