# -*- coding: utf-8 -*-
import requests
import json
import os

# ElevenLabs API 설정
API_KEY = "sk_d8ed866cdeac75d55951a603ec47132e2717e453582f7395"
VOICE_ID = "uyVNoMrnUku1dZyVEXwD"  # Anna Kim 음성 ID

def generate_voice(text, filename):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": API_KEY
    }
    
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.85,  # 노인분들을 위해 더 안정적으로
            "similarity_boost": 0.9,  # 더 명확하게
            "style": 0.0,
            "use_speaker_boost": True
        }
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            # public 폴더가 없으면 생성
            os.makedirs("public", exist_ok=True)
            
            with open(f"public/{filename}", "wb") as f:
                f.write(response.content)
            print(f"✅ {filename} 생성 완료")
            return True
        else:
            print(f"❌ {filename} 생성 실패: {response.status_code}")
            print(f"응답: {response.text}")
            return False
    except Exception as e:
        print(f"❌ {filename} 생성 중 오류: {e}")
        return False

# Assessment.tsx용 음성 파일들 (노인분들을 위한 친근한 톤)
assessment_voices = [
    # Setup 단계
    ("안녕하세요. 뇌파 검사에 오신 것을 환영합니다. 검사를 시작하기 전에 몇 가지 확인해야 할 사항이 있습니다. 천천히 따라해 주세요.", "welcome_message.mp3"),
    ("첫째, 조용하고 편안한 환경에서 진행해주세요. 둘째, 머리 근처의 금속 장신구를 제거해주세요. 셋째, 안내에 따라 뇌파 헤드셋을 준비해주세요. 차근차근 따라해 주세요.", "before_start_checklist.mp3"),
    ("시리얼 넘버는 헤드밴드를 착용했을 때 왼쪽 귀 바로 옆, 헤드밴드 안쪽 부분에 인쇄되어 있습니다. 예를 들어 2379와 같이 맨 뒷자리 4자리 숫자만 입력해주시면 됩니다. 천천히 찾아보세요.", "serial_number_guide.mp3"),
    ("시리얼 넘버가 입력되었습니다. 잘하셨습니다. 이제 검사를 시작할 수 있습니다.", "serial_input_complete.mp3"),
    ("시리얼 넘버 위치 가이드를 확인해주세요. 헤드밴드 착용 시 왼쪽 귀 옆 안쪽 부분을 확인하시면 됩니다. 천천히 찾아보세요.", "guide_view_guide.mp3"),
    
    # Preparation 단계
    ("뇌파 검사를 위해 장비를 올바르게 착용해주세요. 헤드셋을 머리에 편안하게 착용하시고, 4개 전극 모두 피부와 잘 접촉하는지 확인하세요. 천천히 착용해 주세요.", "device_wear_guide.mp3"),
    ("장비 확인을 시작합니다. 첫째, 장비 전원을 키고 불이 잘 들어오는지 확인하세요. 둘째, 헤드셋을 머리에 편안하게 착용하세요. 셋째, 장비를 이마에 닿게 잘 착용하세요. 넷째, 편안히 앉아서 움직이지 마세요. 차근차근 따라해 주세요.", "device_checklist.mp3"),
    ("전극 배치를 확인해주세요. 4개 전극이 모두 피부와 잘 접촉하는지 확인하세요. 전극이 제대로 접촉되지 않으면 측정이 정확하지 않을 수 있습니다. 천천히 확인해 주세요.", "electrode_placement.mp3"),
    ("장비 연결이 성공적으로 완료되었습니다. 잘하셨습니다! 이제 뇌파 측정을 시작할 수 있습니다.", "connection_success.mp3"),
    ("장비 연결에 실패했습니다. 장비 전원이 켜져 있는지, 시리얼 넘버가 올바른지 확인해주세요. 다시 한번 시도해 주세요.", "connection_failed.mp3"),
    
    # Recording 단계
    ("뇌파 측정을 시작합니다. 눈을 감고 편안하게 앉아있어주세요. 움직이지 말고 편안한 상태를 유지해주세요. 긴장하지 마세요.", "measurement_start.mp3"),
    ("측정이 1분 진행되었습니다. 잘하고 계십니다. 눈을 감고 편안하게 앉아있어주세요.", "measurement_1min.mp3"),
    ("측정이 2분 진행되었습니다. 거의 다 왔습니다. 움직이지 말고 편안한 상태를 유지해주세요.", "measurement_2min.mp3"),
    ("측정이 거의 완료되었습니다. 조금만 더 기다려주세요. 잘하고 계십니다.", "measurement_almost_done.mp3"),
    ("뇌파 측정이 완료되었습니다! 수고하셨습니다. 데이터를 분석하고 있습니다.", "measurement_complete.mp3"),
    
    # Processing 단계
    ("뇌파 데이터 분석을 시작합니다. AI가 귀하의 뇌파 패턴을 처리하고 있습니다. 잠시만 기다려주세요. 곧 완료됩니다.", "analysis_start.mp3"),
    ("분석이 진행 중입니다. 처리는 일반적으로 1-2분이 소요됩니다. 이 창을 닫지 마세요. 조금만 기다려주세요.", "analysis_progress.mp3"),
    
    # Complete 단계
    ("검사가 완료되었습니다! 수고하셨습니다. 뇌파 검사 결과를 검토할 준비가 되었습니다.", "test_complete.mp3"),
    ("뇌파가 성공적으로 분석되었습니다. 다음 단계로 진행하여 인지 기능 검사를 완료하세요. 잘하고 계십니다.", "next_step_guide.mp3"),
    
    # 에러 상황
    ("오류가 발생했습니다. 걱정하지 마세요. 장비를 제대로 착용해주세요. 전극이 피부와 잘 접촉하는지 확인하고, LED가 녹색인지 확인해주세요.", "error_retry.mp3"),
    ("음성 재생에 실패했습니다. 다시 시도해주세요. 괜찮습니다.", "audio_play_failed.mp3")
]

# MemoryHelper용 음성 파일들 (노인분들을 위한 친근한 톤)
memory_helper_voices = [
    ("안녕하세요. 기억 도우미 상담 로봇입니다. 함께 이야기 나누며 도와드리겠습니다. 편안하게 대화해 주세요.", "memory_helper_welcome.mp3"),
    ("상담을 시작하겠습니다. 편안하게 앉아서 대화를 나누어보세요. 어떤 것이든 편하게 말씀해주세요. 천천히 말씀해 주세요.", "consultation_start.mp3"),
    ("상담을 종료하시겠습니까? 언제든지 다시 상담을 시작할 수 있습니다. 괜찮으시면 종료해 주세요.", "consultation_end.mp3"),
    ("상담이 완료되었습니다. 수고하셨습니다. 이제 뇌파 검사로 진행하시겠습니까?", "consultation_complete.mp3")
]

print("🎤 ElevenLabs API로 Anna Kim 음성 파일 생성 시작...")

# Assessment.tsx 음성 파일들 생성
print("\n📋 Assessment.tsx 음성 파일들 생성 중...")
assessment_success = 0
for text, filename in assessment_voices:
    if generate_voice(text, filename):
        assessment_success += 1

# MemoryHelper 음성 파일들 생성
print("\n📋 MemoryHelper 음성 파일들 생성 중...")
memory_success = 0
for text, filename in memory_helper_voices:
    if generate_voice(text, filename):
        memory_success += 1

print(f"\n🎉 Anna Kim 음성 파일 생성 완료!")
print(f"Assessment.tsx: {assessment_success}/{len(assessment_voices)} 성공")
print(f"MemoryHelper: {memory_success}/{len(memory_helper_voices)} 성공")
print(f"총 성공: {assessment_success + memory_success}/{len(assessment_voices) + len(memory_helper_voices)}")