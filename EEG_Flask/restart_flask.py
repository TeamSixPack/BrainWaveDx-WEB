#!/usr/bin/env python3
"""
Flask 서버 재시작 스크립트
VSCode에서 실행하여 Flask 서버를 안전하게 재시작할 수 있습니다.
"""

import os
import sys
import time
import subprocess
import signal
import psutil

def find_flask_processes():
    """Flask 서버 프로세스를 찾습니다."""
    flask_processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            if proc.info['name'] == 'python.exe' and proc.info['cmdline']:
                cmdline = ' '.join(proc.info['cmdline'])
                if 'app.py' in cmdline:
                    flask_processes.append(proc)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return flask_processes

def kill_flask_processes():
    """Flask 서버 프로세스를 종료합니다."""
    print("🔍 Flask 서버 프로세스 찾는 중...")
    flask_processes = find_flask_processes()
    
    if not flask_processes:
        print("✅ 실행 중인 Flask 서버가 없습니다.")
        return True
    
    print(f"📋 {len(flask_processes)}개의 Flask 서버 프로세스 발견:")
    for proc in flask_processes:
        print(f"   - PID {proc.info['pid']}: {' '.join(proc.info['cmdline'])}")
    
    # 프로세스 종료
    for proc in flask_processes:
        try:
            print(f"🔄 PID {proc.info['pid']} 프로세스 종료 중...")
            proc.terminate()
            proc.wait(timeout=5)
            print(f"✅ PID {proc.info['pid']} 프로세스 종료 완료")
        except psutil.TimeoutExpired:
            print(f"⚠️ PID {proc.info['pid']} 프로세스 강제 종료 중...")
            proc.kill()
        except Exception as e:
            print(f"❌ PID {proc.info['pid']} 프로세스 종료 실패: {e}")
    
    # 추가 대기
    time.sleep(2)
    
    # 남은 프로세스 확인
    remaining = find_flask_processes()
    if remaining:
        print(f"⚠️ {len(remaining)}개의 프로세스가 여전히 실행 중입니다.")
        return False
    else:
        print("✅ 모든 Flask 서버 프로세스 종료 완료")
        return True

def start_flask_server():
    """새로운 Flask 서버를 시작합니다."""
    print("🚀 새로운 Flask 서버 시작 중...")
    
    try:
        # 가상환경 활성화 (Windows)
        if os.name == 'nt':
            activate_script = os.path.join('.venv', 'Scripts', 'activate.bat')
            if os.path.exists(activate_script):
                cmd = f'call "{activate_script}" && python app.py'
                subprocess.Popen(cmd, shell=True, cwd=os.getcwd())
            else:
                subprocess.Popen(['python', 'app.py'], cwd=os.getcwd())
        else:
            # Linux/Mac
            activate_script = os.path.join('.venv', 'bin', 'activate')
            if os.path.exists(activate_script):
                cmd = f'source "{activate_script}" && python app.py'
                subprocess.Popen(cmd, shell=True, cwd=os.getcwd())
            else:
                subprocess.Popen(['python', 'app.py'], cwd=os.getcwd())
        
        print("✅ Flask 서버 시작 완료!")
        print("🌐 http://localhost:8000 에서 서버에 접속할 수 있습니다.")
        return True
        
    except Exception as e:
        print(f"❌ Flask 서버 시작 실패: {e}")
        return False

def main():
    """메인 함수"""
    print("🔄 Flask 서버 재시작 시작...")
    print("=" * 50)
    
    # 1단계: 기존 프로세스 종료
    if not kill_flask_processes():
        print("❌ 기존 프로세스 종료 실패")
        return False
    
    # 2단계: 잠시 대기
    print("⏳ 잠시 대기 중...")
    time.sleep(3)
    
    # 3단계: 새 서버 시작
    if not start_flask_server():
        print("❌ 새 서버 시작 실패")
        return False
    
    print("=" * 50)
    print("🎉 Flask 서버 재시작 완료!")
    return True

if __name__ == "__main__":
    try:
        success = main()
        if success:
            print("\n💡 이제 새 검사를 시도해보세요!")
        else:
            print("\n❌ 재시작에 실패했습니다. 수동으로 확인해주세요.")
        
        # 사용자 입력 대기
        input("\n아무 키나 누르면 종료됩니다...")
        
    except KeyboardInterrupt:
        print("\n\n⚠️ 사용자에 의해 중단되었습니다.")
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류: {e}")
        input("\n아무 키나 누르면 종료됩니다...")
