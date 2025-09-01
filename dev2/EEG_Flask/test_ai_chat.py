#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 채점 API 테스트 스크립트
Flask 서버가 실행 중일 때 AI 채점 기능을 테스트합니다.
"""

import requests
import json

# Flask 서버 URL
BASE_URL = "http://localhost:8000"

def test_place_api():
    """장소 판별 API 테스트"""
    print("🧪 장소 판별 API 테스트")
    print("=" * 50)
    
    test_cases = [
        "집", "병원", "학교", "회사", "카페", "식당", "백화점", "마트", "은행", "공원",
        "장난감", "상상", "물건", "추상", "개념"
    ]
    
    for word in test_cases:
        try:
            response = requests.post(
                f"{BASE_URL}/check_place",
                json={"place": word},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ '{word}': {result}")
            else:
                print(f"❌ '{word}': HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ '{word}': 오류 - {e}")
    
    print()

def test_moca_q3_api():
    """MoCA Q3 답변 검증 API 테스트"""
    print("🧪 MoCA Q3 답변 검증 API 테스트")
    print("=" * 50)
    
    test_cases = [
        "깨끗하게 하기 위해",
        "위생을 위해",
        "더러워서",
        "청결을 위해",
        "깨끗하게 입기 위해",
        "위생적이기 위해",
        "청결하게 하기 위해",
        "더러운 옷을 입으면 안 되니까",
        "깨끗한 옷을 입어야 하니까",
        "위생상 좋지 않으니까",
        "아무 이유 없음",
        "모르겠음",
        "상관없음"
    ]
    
    for answer in test_cases:
        try:
            response = requests.post(
                f"{BASE_URL}/check_moca_q3",
                json={"answer": answer},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ '{answer}': {result}")
            else:
                print(f"❌ '{answer}': HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ '{answer}': 오류 - {e}")
    
    print()

def test_moca_q4_api():
    """MoCA Q4 답변 검증 API 테스트"""
    print("🧪 MoCA Q4 답변 검증 API 테스트")
    print("=" * 50)
    
    test_cases = [
        "경찰서에 맡기기",
        "경찰서에 가져가기",
        "경찰에 신고하기",
        "경찰서에 전화하기",
        "경찰서에 방문하기",
        "경찰서에 제출하기",
        "경찰서에 보내기",
        "경찰서에 연락하기",
        "경찰서에 알리기",
        "경찰서에 찾아가기",
        "아무것도 안 하기",
        "그냥 두기",
        "모르겠음",
        "상관없음"
    ]
    
    for answer in test_cases:
        try:
            response = requests.post(
                f"{BASE_URL}/check_moca_q4",
                json={"answer": answer},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ '{answer}': {result}")
            else:
                print(f"❌ '{answer}': HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ '{answer}': 오류 - {e}")
    
    print()

def test_server_health():
    """서버 상태 확인"""
    print("🏥 Flask 서버 상태 확인")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 서버 정상: {result}")
            return True
        else:
            print(f"❌ 서버 오류: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 서버 연결 실패: {e}")
        return False

if __name__ == "__main__":
    print("🚀 AI 채점 API 테스트 시작")
    print("=" * 60)
    
    # 서버 상태 확인
    if not test_server_health():
        print("❌ Flask 서버가 실행되지 않았습니다.")
        print("   python app.py 명령으로 서버를 먼저 실행해주세요.")
        exit(1)
    
    print()
    
    # 각 API 테스트
    test_place_api()
    test_moca_q3_api()
    test_moca_q4_api()
    
    print("🎉 모든 테스트 완료!")
