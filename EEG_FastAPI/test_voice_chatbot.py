#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
음성 챗봇 API 테스트 스크립트
FastAPI 서버의 /voice-chatbot 엔드포인트를 테스트합니다.
"""

import requests
import json
import time

# FastAPI 서버 설정
BASE_URL = "http://localhost:8001"  # 8000에서 8001로 변경

def test_voice_chatbot():
    """음성 챗봇 API 테스트"""
    
    # 테스트 케이스들
    test_cases = [
        {
            "name": "기억력 저하 증상",
            "question": "자주 쓰던 물건 이름이 갑자기 생각안 난적이 있나요?",
            "response": "네, 최근에 자주 그런 일이 있어요. 아침에 커피잔을 어디에 두었는지 기억이 안 나서 30분 동안 찾았어요. 그리고 친구 이름도 갑자기 생각이 안 나서 부끄러웠어요."
        },
        {
            "name": "단어 회상 곤란",
            "question": "대화중단어가 잘 떠오르지 않아서 곤란했던 적이 있나요?",
            "response": "맞아요, 대화하다가 '그거'라고만 하고 정확한 단어가 떠오르지 않아서 답답했어요. 특히 중요한 회의에서 그런 일이 자주 있어서 걱정이에요."
        },
        {
            "name": "일상생활 곤란",
            "question": "가족이나 지인이 평소와 다르다고 한적이 있나요?",
            "response": "아내가 제가 요리 순서를 자꾸 바꾸고, 약속 시간을 잘못 기억한다고 말해요. 최근에는 길을 잃어버려서 1시간 동안 헤맸어요."
        },
        {
            "name": "치매와 무관한 대화",
            "question": "최근에 불편했던 점이나 걱정되는 점이 있나요?",
            "response": "오늘 점심에 뭐 먹을지 고민이에요. 치킨이랑 피자 중에 뭐가 더 맛있을까요?"
        }
    ]
    
    print("🎤 음성 챗봇 API 테스트 시작\n")
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"📝 테스트 케이스 {i}: {test_case['name']}")
        print(f"질문: {test_case['question']}")
        print(f"답변: {test_case['response']}")
        print("-" * 80)
        
        # API 요청
        payload = {
            "user_response": test_case['response'],
            "question_context": test_case['question'],
            "session_id": f"test-session-{i}",
            "user_id": "test-user-001"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/voice-chatbot",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ API 응답 성공!")
                
                # 결과 분석
                if result.get("status") == "success":
                    analysis = result.get("analysis", {})
                    
                    # 요약
                    summary = analysis.get("summary", {})
                    if "error" not in summary:
                        print("📋 요약:")
                        for key, value in summary.items():
                            if isinstance(value, list):
                                print(f"  {key}: {', '.join(value)}")
                            else:
                                print(f"  {key}: {value}")
                    
                    # 심리상태
                    psych = analysis.get("psychological_state", {})
                    if "error" not in psych:
                        print("🧠 심리상태:")
                        for key, value in psych.items():
                            if isinstance(value, list):
                                print(f"  {key}: {', '.join(value)}")
                            else:
                                print(f"  {key}: {value}")
                    
                    # 주의사항
                    cautions = analysis.get("cautions", {})
                    if "error" not in cautions:
                        print("⚠️ 주의사항:")
                        for key, value in cautions.items():
                            if isinstance(value, list):
                                print(f"  {key}: {', '.join(value)}")
                            else:
                                print(f"  {key}: {value}")
                    
                elif result.get("status") == "off_topic":
                    print("❌ 치매와 무관한 주제입니다.")
                    print(f"메시지: {result.get('message')}")
                    
                else:
                    print(f"❌ 분석 실패: {result.get('error', '알 수 없는 오류')}")
                    
            else:
                print(f"❌ API 오류: {response.status_code}")
                print(f"응답: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ 요청 오류: {e}")
        
        print("\n" + "=" * 80 + "\n")
        time.sleep(1)  # API 호출 간격 조절

# 테스트 케이스 추가
print("\n📝 테스트 케이스 5: 짧은 답변 테스트")
print("질문: 최근에 불편했던 점이나 걱정되는 점이 있나요?")
print("답변: 힘듭니다")
print("=" * 80)

try:
    response = requests.post(
        f"{BASE_URL}/voice-chatbot",
        json={
            "user_response": "힘듭니다",
            "question_context": "최근에 불편했던 점이나 걱정되는 점이 있나요?",
            "session_id": "test_session_5",
            "user_id": "test_user_5"
        },
        timeout=30
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ API 응답 성공!")
        
        # 토픽 감지 정보 출력
        topic_info = result.get("topic_detection", {})
        if topic_info:
            print(f"🔍 토픽 감지 정보:")
            print(f"  라벨: {topic_info.get('label', 'N/A')}")
            print(f"  확률: {topic_info.get('prob', 'N/A')}")
            print(f"  증거: {topic_info.get('evidence', [])}")
        
        # 상태에 따른 출력
        if result.get("status") == "off_topic":
            print(f"🔄 오프토픽 감지:")
            print(f"메시지: {result.get('message', 'N/A')}")
            if topic_info:
                print(f"라벨: {topic_info.get('label', 'N/A')}")
                print(f"확률: {topic_info.get('prob', 'N/A')}")
        elif result.get("status") == "success":
            print("📋 요약:")
            if "analysis" in result and "summary" in result["analysis"]:
                summary = result["analysis"]["summary"]
                for key, value in summary.items():
                    print(f"  {key}: {value}")
            
            print("🧠 심리상태:")
            if "analysis" in result and "psychological_state" in result["analysis"]:
                psych = result["analysis"]["psychological_state"]
                for key, value in psych.items():
                    print(f"  {key}: {value}")
            
            print("⚠️ 주의사항:")
            if "analysis" in result and "cautions" in result["analysis"]:
                cautions = result["analysis"]["cautions"]
                for key, value in cautions.items():
                    print(f"  {key}: {value}")
        else:
            print(f"❓ 예상치 못한 상태: {result.get('status', 'N/A')}")
            print(f"전체 응답: {result}")
            
    else:
        print(f"❌ API 오류: {response.status_code}")
        print(f"응답: {response.text}")
        
except Exception as e:
    print(f"❌ 테스트 실패: {e}")

print("\n" + "=" * 80)

def test_health_check():
    """헬스 체크 테스트"""
    try:
        response = requests.get(f"{BASE_URL}/healthz")
        if response.status_code == 200:
            print("✅ 서버 상태: 정상")
            print(f"응답: {response.json()}")
        else:
            print(f"❌ 서버 상태: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ 서버 연결 실패: {e}")

if __name__ == "__main__":
    print("🚀 FastAPI 음성 챗봇 테스트 시작")
    print(f"서버 주소: {BASE_URL}")
    print()
    
    # 헬스 체크
    test_health_check()
    print()
    
    # 음성 챗봇 테스트
    test_voice_chatbot()
    
    print("🎯 테스트 완료!")
