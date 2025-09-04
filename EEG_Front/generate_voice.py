import requests
import json
import os
import shutil

def get_voices(api_key):
    """사용 가능한 목소리 목록을 가져옵니다."""
    url = "https://api.elevenlabs.io/v1/voices"
    headers = {
        "Accept": "application/json",
        "xi-api-key": api_key
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        voices = response.json()["voices"]
        # Anna Kim 목소리 찾기
        for voice in voices:
            if "Anna Kim" in voice.get("name", ""):
                return voice["voice_id"]
        return voices[0]["voice_id"] if voices else None
    return None

def generate_speech(text, voice_id, api_key, filename):
    """텍스트를 음성으로 변환하고 MP3 파일로 저장합니다."""
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.9,           # 🧓 더 높은 안정성 (일관된 톤)
            "similarity_boost": 0.95,   # 🧓 더 높은 유사성 (자연스러운 발음)
            "style": 0.1,               # 🧓 더 낮은 스타일 (감정 표현 최소화)
            "use_speaker_boost": True,  # 🧓 스피커 부스트 활성화 (명확한 발음)
            "speed": 0.7                # 🧓 노인층 최적화: 최대한 느린 속도 (70%)
        }
    }
    
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code == 200:
        # MP3 파일로 저장
        with open(filename, "wb") as f:
            f.write(response.content)
        print(f"✅ {filename} 생성 완료!")
        return True
    else:
        print(f"❌ 오류 발생: {response.status_code}")
        print(f"응답: {response.text}")
        return False

def main():
    # API 키 설정 - 새로운 키로 업데이트
    api_key = "sk_43685b9c658d76cc305f9ddddec8d1e28d20a5456e79c243"
    
    # 목소리 ID 가져오기
    print("🔍 Anna Kim 목소리 찾는 중...")
    voice_id = get_voices(api_key)
    
    if not voice_id:
        print("❌ 사용 가능한 목소리를 찾을 수 없습니다.")
        return
    
    print(f"✅ 목소리 ID: {voice_id}")
    
    # 1. 메인 안내 음성 생성 (자연스러운 노인 대화 방식)
    main_guide_text = """안녕하세요... 뇌파 검사를 시작하기 전에... 
몇 가지 확인해야 할 사항이 있습니다...

첫째... 조용하고 편안한 환경에서 진행해주세요...
둘째... 머리 근처의 금속 장신구를 제거해주세요...
셋째... 안내에 따라 뇌파 헤드셋을 준비해주세요...

시리얼 넘버를 입력하시면... 검사를 시작할 수 있습니다..."""
    
    print("\n🎤 메인 안내 음성 생성 중...")
    generate_speech(main_guide_text, voice_id, api_key, "main_guide.mp3")
    
    # 2. 체크리스트 안내 음성 생성 (자연스러운 노인 대화 방식)
    checklist_guide_text = """체크리스트를 확인해주세요...

첫째, 조용하고 편안한 환경에서 진행해주세요...
둘째, 머리 근처의 금속 장신구를 제거해주세요...
셋째, 안내에 따라 뇌파 헤드셋을 준비해주세요...

모든 항목을 확인하신 후 진행해주세요..."""
    
    print("\n🎤 체크리스트 안내 음성 생성 중...")
    generate_speech(checklist_guide_text, voice_id, api_key, "checklist_guide.mp3")
    
    # 3. 시리얼 넘버 안내 음성 생성 (자연스러운 노인 대화 방식)
    serial_guide_text = """시리얼 넘버는 헤드밴드 내부나 측면에 표시되어 있습니다...
맨 뒷자리 4자리 숫자만 입력하면 됩니다...
예를 들어 2379와 같은 형태입니다...

헤드밴드를 착용한 상태에서 거울을 보거나
다른 사람의 도움을 받아 확인하세요..."""
    
    print("\n🎤 시리얼 넘버 안내 음성 생성 중...")
    generate_speech(serial_guide_text, voice_id, api_key, "serial_guide.mp3")
    
    # 4. 시리얼 넘버 위치 가이드 상세 음성 생성 (새로 추가!)
    serial_location_guide_text = """시리얼 넘버 위치를 자세히 안내해드리겠습니다...

첫째, 헤드밴드를 착용한 상태에서 왼쪽 귀를 확인해주세요...
둘째, 왼쪽 귀 바로 옆, 헤드밴드 안쪽 부분을 살펴보세요...
셋째, 거울을 보거나 다른 사람의 도움을 받아 확인하세요...

시리얼 넘버는 'SN' 다음에 표시되어 있습니다...
예를 들어, SN: 4301-0113-2379에서...
맨 뒷자리 4자리 숫자인 2379만 입력하시면 됩니다...

헤드밴드가 어둡게 보이면 조명을 밝게 해주세요...
작은 글씨이므로 안경을 착용하고 확인하시는 것이 좋습니다..."""
    
    print("\n🎤 시리얼 넘버 위치 가이드 상세 음성 생성 중...")
    generate_speech(serial_location_guide_text, voice_id, api_key, "serial_location_guide.mp3")
    
    # 5. 기억 도우미 상담 로봇 안내 음성 생성 (새로 추가!)
    memory_helper_guide_text = """안녕하세요... 저는 기억 도우미 상담 로봇입니다...

함께 이야기 나누며... 도와드리겠습니다...

뇌파 검사는 총 5단계로 진행됩니다...
첫째... 시작 단계입니다...
둘째... 질문 단계입니다...
셋째... 녹음 단계입니다...
넷째... 분석 단계입니다...
다섯째... 결과 단계입니다...

상담 시작 버튼을 눌러주시면... 검사를 시작할 수 있습니다..."""
    
    print("\n🤖 기억 도우미 상담 로봇 안내 음성 생성 중...")
    generate_speech(memory_helper_guide_text, voice_id, api_key, "memory_helper_guide.mp3")
    
    # 6. 가이드 보기 버튼 안내 음성 생성 (새로 추가!)
    guide_button_text = """가이드 보기... 이거를 눌러주세요...
    
시리얼 넘버를 찾기 어려우시면... 
가이드 보기 버튼을 눌러주세요...
자세한 안내를 도와드리겠습니다..."""
    
    print("\n🎤 가이드 보기 버튼 안내 음성 생성 중...")
    generate_speech(guide_button_text, voice_id, api_key, "guide_button_guide.mp3")
    
    # 7. 생성된 파일들을 client/public/ 폴더로 복사
    print("\n📁 파일 복사 중...")
    public_dir = "client/public"
    
    if not os.path.exists(public_dir):
        os.makedirs(public_dir)
    
    files_to_copy = ["main_guide.mp3", "checklist_guide.mp3", "serial_guide.mp3", "serial_location_guide.mp3", "memory_helper_guide.mp3", "guide_button_guide.mp3"]
    
    for file in files_to_copy:
        if os.path.exists(file):
            dest_path = os.path.join(public_dir, file)
            shutil.copy2(file, dest_path)
            print(f"✅ {file} → {dest_path}")
        else:
            print(f"❌ {file} 파일을 찾을 수 없습니다.")
    
    print("\n🎉 모든 음성 파일 생성 및 복사 완료!")
    print("📂 위치: client/public/")

if __name__ == "__main__":
    main()
