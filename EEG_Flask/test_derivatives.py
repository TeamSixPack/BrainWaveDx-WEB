import os
import hashlib
import mne
import numpy as np
from pathlib import Path

def analyze_derivatives_folder():
    """derivatives 폴더의 파일들을 분석하여 문제 원인 파악"""
    
    # derivatives 폴더 경로
    derivatives_path = r"C:\Users\smhrd\Desktop\뇌파\derivatives"
    
    if not os.path.exists(derivatives_path):
        print(f"❌ derivatives 폴더를 찾을 수 없습니다: {derivatives_path}")
        return
    
    print(f"🔍 derivatives 폴더 분석 시작: {derivatives_path}")
    print("=" * 60)
    
    # .set 파일들 찾기
    set_files = []
    for root, dirs, files in os.walk(derivatives_path):
        for file in files:
            if file.endswith('.set'):
                full_path = os.path.join(root, file)
                set_files.append(full_path)
    
    if not set_files:
        print("❌ .set 파일을 찾을 수 없습니다.")
        return
    
    print(f"📁 발견된 .set 파일 수: {len(set_files)}")
    print()
    
    # 파일 정보 분석
    file_info = []
    for file_path in set_files:
        try:
            # 파일 크기
            file_size = os.path.getsize(file_path)
            
            # 파일 해시 (첫 1MB만)
            with open(file_path, 'rb') as f:
                first_mb = f.read(1024 * 1024)  # 1MB
                file_hash = hashlib.md5(first_mb).hexdigest()
            
            # MNE로 파일 정보 읽기
            try:
                raw = mne.io.read_raw_eeglab(file_path, preload=False, verbose='ERROR')
                channels = raw.ch_names
                duration = raw.times[-1] if len(raw.times) > 0 else 0
                sample_rate = raw.info['sfreq']
            except Exception as e:
                channels = []
                duration = 0
                sample_rate = 0
                print(f"⚠️  {os.path.basename(file_path)} 읽기 실패: {e}")
            
            file_info.append({
                'path': file_path,
                'size': file_size,
                'hash': file_hash,
                'channels': channels,
                'duration': duration,
                'sample_rate': sample_rate
            })
            
        except Exception as e:
            print(f"❌ {file_path} 분석 실패: {e}")
    
    # 결과 출력
    print("📊 파일 분석 결과:")
    print("-" * 60)
    
    for i, info in enumerate(file_info):
        print(f"파일 {i+1}: {os.path.basename(info['path'])}")
        print(f"  경로: {info['path']}")
        print(f"  크기: {info['size']:,} bytes")
        print(f"  해시: {info['hash']}")
        print(f"  채널 수: {len(info['channels'])}")
        print(f"  지속시간: {info['duration']:.1f}초")
        print(f"  샘플레이트: {info['sample_rate']:.1f} Hz")
        if info['channels']:
            print(f"  채널들: {', '.join(info['channels'][:5])}{'...' if len(info['channels']) > 5 else ''}")
        print()
    
    # 중복 파일 확인
    print("🔍 중복 파일 확인:")
    print("-" * 60)
    
    # 크기별 그룹화
    size_groups = {}
    for info in file_info:
        size = info['size']
        if size not in size_groups:
            size_groups[size] = []
        size_groups[size].append(info)
    
    duplicate_sizes = {size: files for size, files in size_groups.items() if len(files) > 1}
    
    if duplicate_sizes:
        print("⚠️  같은 크기의 파일들 발견:")
        for size, files in duplicate_sizes.items():
            print(f"  크기 {size:,} bytes:")
            for file_info in files:
                print(f"    - {os.path.basename(file_info['path'])}")
                print(f"      해시: {file_info['hash']}")
        print()
    else:
        print("✅ 모든 파일의 크기가 다릅니다.")
    
    # 해시별 그룹화
    hash_groups = {}
    for info in file_info:
        file_hash = info['hash']
        if file_hash not in hash_groups:
            hash_groups[file_hash] = []
        hash_groups[file_hash].append(info)
    
    duplicate_hashes = {file_hash: files for file_hash, files in hash_groups.items() if len(files) > 1}
    
    if duplicate_hashes:
        print("🚨 같은 해시값의 파일들 발견 (동일한 내용):")
        for file_hash, files in duplicate_hashes.items():
            print(f"  해시 {file_hash}:")
            for file_info in files:
                print(f"    - {os.path.basename(file_info['path'])}")
        print()
    else:
        print("✅ 모든 파일의 해시값이 다릅니다.")
    
    # 채널 정보 비교
    print("📡 채널 정보 비교:")
    print("-" * 60)
    
    channel_sets = {}
    for info in file_info:
        channels_str = ','.join(sorted(info['channels']))
        if channels_str not in channel_sets:
            channel_sets[channels_str] = []
        channel_sets[channels_str].append(info)
    
    if len(channel_sets) > 1:
        print("⚠️  서로 다른 채널 구성을 가진 파일들:")
        for i, (channels_str, files) in enumerate(channel_sets.items()):
            print(f"  그룹 {i+1} (채널: {channels_str}):")
            for file_info in files:
                print(f"    - {os.path.basename(file_info['path'])}")
        print()
    else:
        print("✅ 모든 파일이 동일한 채널 구성을 가집니다.")

if __name__ == "__main__":
    analyze_derivatives_folder()
