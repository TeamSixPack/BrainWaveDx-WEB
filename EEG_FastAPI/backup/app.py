# -*- coding: utf-8 -*-
"""
app.py
- Flask 서버
- POST /chatbot : 파일 경로(예: ./script.txt) 또는 transcript 문자열을 받아 요약 JSON 응답
- ✅ 모델/파라미터 동적 오버라이드 지원
"""

import os, time
from typing import Optional, Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS

from chabot_model import summarise_from_file, run_summarisation_pipeline, mark_guide_question_shown

app = Flask(__name__)
CORS(app)

@app.route("/healthz", methods=["GET"])
def healthz():
    return jsonify({"status": "ok", "time": time.time()})

@app.route("/chatbot", methods=["POST"])
@app.route("/chatbot.do", methods=["POST"])  # 스프링과의 경로 호환
def chatbot():
    """
    요청(JSON):
    {
      "file_path": "./script.txt",         # 옵션: 있으면 파일에서 읽음
      "transcript": "직접 텍스트",          # 옵션: file_path 없을 때 사용
      "guide_question_index": 0~3,         # 옵션(기본 3)
      "session_id": "user-123",            # 옵션

      # === 모델/파라미터 오버라이드(선택) ===
      "chat_model": "gpt-4o",              # 전체 Chat 모델 일괄 적용
      "embed_model": "text-embedding-3-large",
      "temperature": 0.2,
      "max_tokens": 900,

      # 또는 컴포넌트별
      "models": {
        "summary": "gpt-4o",
        "judge":   "gpt-4.1-mini",
        "emotion": "gpt-4o-mini",
        "query":   "gpt-4o-mini",
        "embed":   "text-embedding-3-small"
      }
    }
    """
    try:
        data: Dict[str, Any] = request.get_json(force=True, silent=False) or {}

        file_path: Optional[str] = data.get("file_path")
        transcript: Optional[str] = data.get("transcript")
        guide_idx = int(data.get("guide_question_index", 3))
        session_id = (data.get("session_id") or "rest-session-1").strip()

        # 모델/파라미터 오버라이드 수집
        overrides = {
            "chat_model": data.get("chat_model"),
            "embed_model": data.get("embed_model"),
            "temperature": data.get("temperature"),
            "max_tokens": data.get("max_tokens"),
            "models": data.get("models") if isinstance(data.get("models"), dict) else None
        }

        # 기본: 파일 우선 → 없으면 transcript → 모두 없으면 ./script.txt
        if not file_path and not transcript:
            default_fp = "./script.txt"
            if os.path.exists(default_fp):
                file_path = default_fp
            else:
                return jsonify({"status": "error", "message": "file_path 또는 transcript가 필요합니다."}), 400

        if file_path:
            result = summarise_from_file(file_path, guide_question_index=guide_idx, session_id=session_id, **overrides)
        else:
            if not transcript or not transcript.strip():
                return jsonify({"status": "error", "message": "transcript가 비어 있습니다."}), 400
            # 스프링 흐름 상: 가이드 질문을 이미 제시했다고 간주
            mark_guide_question_shown(session_id)
            result = run_summarisation_pipeline(transcript.strip(), guide_question_index=guide_idx, session_id=session_id, **overrides)

        return jsonify(result), 200

    except FileNotFoundError as e:
        return jsonify({"status": "error", "message": str(e)}), 404
    except Exception as e:
        # 디버깅이 필요할 때 아래 줄을 임시로 주석 해제하여 상세 오류 확인 가능
        # import traceback; print(traceback.format_exc())
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=False)
