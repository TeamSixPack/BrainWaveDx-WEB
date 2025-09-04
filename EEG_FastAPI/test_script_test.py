#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_script_test.py
- test_script 폴더의 모든 스크립트 파일을 FastAPI로 테스트
- test_voice_chatbot.py와 동일한 방식으로 작동
"""

import os
import json
import requests
from pathlib import Path

# FastAPI 서버 설정
BASE_URL = "http://localhost:8001"

def test_server_status():
    """서버 상태 확인"""
    try:
        # FastAPI 서버 상태 확인을 위해 /voice-chatbot 엔드포인트로 간단한 테스트
        response = requests.post(f"{BASE_URL}/voice-chatbot", json={
            "user_response": "서버 상태 확인",
            "question_context": "테스트",
            "session_id": "status-check",
            "user_id": "status-check"
        })
        if response.status_code == 200:
            print(f"✅ 서버 상태: 정상")
            print(f"응답 상태: {response.status_code}")
            return True
        else:
            print(f"❌ 서버 오류: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 서버 연결 실패: {e}")
        return False

def test_voice_chatbot_endpoint():
    """음성 챗봇 엔드포인트 테스트"""
    try:
        response = requests.post(f"{BASE_URL}/voice-chatbot", json={
            "user_response": "테스트 메시지입니다.",
            "question_context": "테스트 질문입니다.",
            "session_id": "test-script-test",
            "user_id": "test-user"
        })
        if response.status_code == 200:
            print(f"✅ 음성 챗봇 엔드포인트: 정상")
            return True
        else:
            print(f"❌ 음성 챗봇 엔드포인트 오류: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 음성 챗봇 엔드포인트 테스트 실패: {e}")
        return False

def read_script_file(file_path):
    """스크립트 파일 읽기"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
        return content
    except Exception as e:
        print(f"⚠️ 파일 읽기 실패 {file_path}: {e}")
        return None

def test_script_with_fastapi(script_content, filename, question_context="최근에 불편했던 점이나 걱정되는 점이 있나요?"):
    """개별 스크립트를 FastAPI로 테스트"""
    print(f"\n📝 테스트 케이스: {filename}")
    print(f"질문: {question_context}")
    print(f"답변: {script_content}")
    print("-" * 80)
    
    try:
        response = requests.post(f"{BASE_URL}/voice-chatbot", json={
            "user_response": script_content,
            "question_context": question_context,
            "session_id": f"test-script-{filename}",
            "user_id": "test-user"
        })
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ API 응답 성공!")
            
            if result.get("status") == "success" and result.get("analysis"):
                # topic_detection 정보가 있으면 출력
                if result.get("topic_detection"):
                    topic_detection = result["topic_detection"]
                    print(f"🔍 토픽 감지 정보:")
                    print(f"라벨: {topic_detection.get('label', 'N/A')}")
                    print(f"확률: {topic_detection.get('prob', 'N/A')}")
                    print(f"증거: {topic_detection.get('evidence', [])}")
                
                analysis = result["analysis"]
                
                # 요약
                summary = analysis.get("summary", {})
                if summary and not summary.get("error"):
                    print(f"📋 요약:")
                    if summary.get("main_points"):
                        print(f"  main_points: {', '.join(summary['main_points'])}")
                    if summary.get("symptom_description"):
                        print(f"  symptom_description: {summary['symptom_description']}")
                    if summary.get("impact_on_daily_life"):
                        print(f"  impact_on_daily_life: {summary['impact_on_daily_life']}")
                    if summary.get("frequency"):
                        print(f"  frequency: {summary['frequency']}")
                else:
                    print(f"📋 요약: {summary.get('error', '데이터 없음')}")
                
                # 심리상태
                psych = analysis.get("psychological_state", {})
                if psych and not psych.get("error"):
                    print(f"🧠 심리상태:")
                    if psych.get("emotional_state"):
                        print(f"  emotional_state: {psych['emotional_state']}")
                    if psych.get("symptom_severity"):
                        print(f"  symptom_severity: {psych['symptom_severity']}")
                    if psych.get("key_concerns"):
                        print(f"  key_concerns: {', '.join(psych['key_concerns'])}")
                    if psych.get("coping_strategies"):
                        print(f"  coping_strategies: {', '.join(psych['coping_strategies'])}")
                    if psych.get("professional_advice"):
                        print(f"  professional_advice: {psych['professional_advice']}")
                else:
                    print(f"🧠 심리상태: {psych.get('error', '데이터 없음')}")
                
                # 주의사항
                cautions = analysis.get("cautions", {})
                if cautions and not cautions.get("error"):
                    print(f"⚠️ 주의사항:")
                    if cautions.get("immediate_actions"):
                        print(f"  immediate_actions: {', '.join(cautions['immediate_actions'])}")
                    if cautions.get("safety_measures"):
                        print(f"  safety_measures: {', '.join(cautions['safety_measures'])}")
                    if cautions.get("monitoring_points"):
                        print(f"  monitoring_points: {', '.join(cautions['monitoring_points'])}")
                    if cautions.get("when_to_seek_help"):
                        print(f"  when_to_seek_help: {cautions['when_to_seek_help']}")
                    if cautions.get("family_guidance"):
                        print(f"  family_guidance: {cautions['family_guidance']}")
                else:
                    print(f"⚠️ 주의사항: {cautions.get('error', '데이터 없음')}")
                    
            elif result.get("status") == "off_topic":
                print(f"🔄 오프토픽 감지:")
                print(f"메시지: {result.get('message', '치매와 관련없는 내용')}")
                if result.get("analysis", {}).get("topic_detection"):
                    topic_detection = result["analysis"]["topic_detection"]
                    print(f"라벨: {topic_detection.get('label', 'N/A')}")
                    print(f"확률: {topic_detection.get('prob', 'N/A')}")
                    
            else:
                print(f"❌ 분석 실패: {result}")
                
        else:
            print(f"❌ API 오류: {response.status_code}")
            print(f"응답: {response.text}")
            
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")

def main():
    """메인 테스트 실행"""
    print("🎤 스크립트 파일 FastAPI 테스트 시작")
    print("=" * 80)
    
    # 1. 서버 상태 확인
    if not test_server_status():
        print("❌ 서버가 실행되지 않았습니다. python app_fastapi.py를 실행하세요.")
        return
    
    # 2. 엔드포인트 확인
    if not test_voice_chatbot_endpoint():
        print("❌ 음성 챗봇 엔드포인트에 문제가 있습니다.")
        return
    
    # 3. test_script 폴더의 모든 파일 테스트
    script_dir = Path("test_script")
    if not script_dir.exists():
        print("❌ test_script 폴더를 찾을 수 없습니다.")
        return
    
    script_files = list(script_dir.glob("*.txt"))
    if not script_files:
        print("❌ test_script 폴더에 텍스트 파일이 없습니다.")
        return
    
    print(f"📁 발견된 스크립트 파일: {len(script_files)}개")
    
    # 각 파일 테스트
    for script_file in script_files:
        content = read_script_file(script_file)
        if content:
            test_script_with_fastapi(content, script_file.stem)
    
    print("\n" + "=" * 80)
    print("🎉 모든 스크립트 테스트 완료!")

if __name__ == "__main__":
    main()
