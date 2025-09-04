import requests
import json

def test_eeg_dataset():
    """데이터셋 파일로 EEG 분석 테스트"""
    
    # Flask 서버 URL
    url = "http://127.0.0.1:8000/infer"
    
    # 테스트할 데이터
    payload = {
        "file_path": "C:\\Users\\smhrd\\Desktop\\뇌파\\EEG\\EEG_Flask\\dataset\\sub-083\\eeg\\sub-083_task-eyesclosed_eeg.set",
        "true_label": "CN",  # CN: 정상, AD: 알츠하이머, FTD: 전두측두엽치매
        "subject_id": "sub-044",
        "enforce_two_minutes": True
    }
    
    try:
        print("🧠 EEG 데이터셋 분석 시작...")
        print(f"📁 파일: {payload['file_path']}")
        print(f"🏷️  실제 라벨: {payload['true_label']}")
        print(f"👤 대상자: {payload['subject_id']}")
        print("-" * 50)
        
        # POST 요청 보내기
        response = requests.post(url, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 분석 완료!")
            print("\n📊 분석 결과:")
            print(f"   상태: {result['status']}")
            
            data = result['result']
            print(f"   대상자 ID: {data['subject_id']}")
            print(f"   세그먼트 다수결 라벨: {data['segment_majority_label']}")
            print(f"   세그먼트 다수결 인덱스: {data['segment_majority_index']}")
            print(f"   세그먼트 정확도: {data['segment_accuracy']}")
            print(f"   세그먼트 수: {data['n_segments']}")
            print(f"   세그먼트 분포: {data['segment_counts']}")
            print(f"   확률 분포: {data['prob_mean']}")
            print(f"   사용된 채널: {data['channels_used']}")
            print(f"   분석 창: {data['window']}")
            
        else:
            print(f"❌ 오류 발생: {response.status_code}")
            print(f"오류 내용: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Flask 서버에 연결할 수 없습니다.")
        print("   서버가 실행 중인지 확인하세요: python app.py")
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")

if __name__ == "__main__":
    test_eeg_dataset()
