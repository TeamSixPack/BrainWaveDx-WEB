#!/usr/bin/env python3
"""
CSV 파일 형식 예시 생성기
뇌파 분석을 위한 올바른 CSV 형식을 보여줍니다.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def create_sample_csv():
    """뇌파 분석용 샘플 CSV 파일을 생성합니다."""
    
    # 샘플 데이터 생성 (2분간, 250Hz 샘플링)
    duration_seconds = 120  # 2분
    sample_rate = 250  # Hz
    n_samples = duration_seconds * sample_rate
    
    # 시작 시간
    start_time = datetime.now()
    
    # 타임스탬프 생성
    timestamps = []
    for i in range(n_samples):
        timestamp = start_time + timedelta(seconds=i/sample_rate)
        timestamps.append(timestamp.timestamp())
    
    # 뇌파 데이터 생성 (4채널)
    # 실제 뇌파 데이터는 아니지만 올바른 형식을 보여줍니다
    np.random.seed(42)  # 재현 가능한 랜덤 데이터
    
    eeg_1 = np.random.normal(0, 10, n_samples)  # TP9 채널
    eeg_2 = np.random.normal(0, 10, n_samples)  # AF7 채널  
    eeg_3 = np.random.normal(0, 10, n_samples)  # AF8 채널
    eeg_4 = np.random.normal(0, 10, n_samples)  # TP10 채널
    
    # DataFrame 생성
    df = pd.DataFrame({
        'timestamps': timestamps,
        'eeg_1': eeg_1,
        'eeg_2': eeg_2,
        'eeg_3': eeg_3,
        'eeg_4': eeg_4
    })
    
    # CSV 파일로 저장
    filename = 'sample_eeg_data.csv'
    df.to_csv(filename, index=False)
    
    print(f"✅ 샘플 CSV 파일이 생성되었습니다: {filename}")
    print(f"📊 데이터 정보:")
    print(f"   - 샘플 수: {len(df)}")
    print(f"   - 지속 시간: {duration_seconds}초")
    print(f"   - 샘플링 레이트: {sample_rate}Hz")
    print(f"   - 채널: eeg_1, eeg_2, eeg_3, eeg_4")
    print(f"   - 타임스탬프: 포함")
    print()
    print("📋 CSV 파일 형식:")
    print("timestamps,eeg_1,eeg_2,eeg_3,eeg_4")
    print("1703123456.789,12.34,-5.67,8.90,-2.34")
    print("1703123456.793,11.23,-4.56,7.89,-1.23")
    print("...")
    print()
    print("🔧 사용 방법:")
    print("1. 이 파일을 뇌파 분석 페이지에 업로드")
    print("2. .set 파일과 동일하게 분석 진행")
    print("3. 결과는 동일한 형식으로 반환")

if __name__ == "__main__":
    create_sample_csv()
