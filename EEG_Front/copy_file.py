import shutil
import os

def copy_file_with_english_name():
    """한글 파일명을 영문 파일명으로 복사합니다."""
    
    # 원본 파일 경로 (한글)
    source_file = "client/public/시리얼넘버_안내.mp3"
    
    # 대상 파일 경로 (영문)
    target_file = "client/public/serial_guide.mp3"
    
    try:
        # 파일 복사
        shutil.copy2(source_file, target_file)
        print(f"✅ 파일 복사 완료!")
        print(f"📁 원본: {source_file}")
        print(f"📁 대상: {target_file}")
        
        # 파일 크기 확인
        if os.path.exists(target_file):
            size = os.path.getsize(target_file)
            print(f"📏 파일 크기: {size} bytes ({size/1024:.1f} KB)")
        
        return True
        
    except FileNotFoundError:
        print(f"❌ 원본 파일을 찾을 수 없습니다: {source_file}")
        return False
    except Exception as e:
        print(f"❌ 파일 복사 중 오류 발생: {e}")
        return False

if __name__ == "__main__":
    print("🔄 한글 파일명을 영문 파일명으로 복사 중...")
    success = copy_file_with_english_name()
    
    if success:
        print("\n🎉 파일 복사가 완료되었습니다!")
        print("이제 Assessment.tsx에서 '/serial_guide.mp3' 경로로 접근할 수 있습니다.")
    else:
        print("\n❌ 파일 복사에 실패했습니다.")
