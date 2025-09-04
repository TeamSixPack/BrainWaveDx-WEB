# -*- coding: utf-8 -*-
"""
worker_eeg.py
- BrainFlow 의존 로직을 메인 Flask 프로세스와 격리하여 실행
- 사용법: python worker_eeg.py --serial 0000 --duration 190
"""

import os
import sys
import time
import argparse
import traceback

def run_worker(serial: str, duration: int) -> int:
    try:
        from brainflow.board_shim import BoardShim, BrainFlowInputParams
        import pandas as pd

        params = BrainFlowInputParams()
        params.serial_number = f"Muse-{serial}"

        board_id = 38  # Muse 2
        BoardShim.enable_dev_board_logger()
        board = BoardShim(board_id, params)

        # 준비
        board.prepare_session()
        board.start_stream()
        time.sleep(duration + 1)

        sr = BoardShim.get_sampling_rate(board_id)
        num_points = duration * sr
        data = board.get_current_board_data(num_points)

        # 저장
        base = os.path.dirname(os.path.abspath(__file__))
        os.makedirs(os.path.join(base, 'uploads', 'eeg'), exist_ok=True)
        import pandas as pd
        df = pd.DataFrame(data).T
        df.to_csv(os.path.join(base, 'data.csv'), index=False)

        # 간단 가공
        data_df = pd.read_csv(os.path.join(base, 'data.csv'))
        data_df_cleaned = data_df[['1', '2', '3', '4', '6']].copy()
        data_df_cleaned.rename(columns={'1': 'eeg_1', '2': 'eeg_2', '3': 'eeg_3', '4': 'eeg_4', '6': 'timestamps'}, inplace=True)
        df_final = data_df_cleaned[['timestamps', 'eeg_1', 'eeg_2', 'eeg_3', 'eeg_4']]

        filename = f"eeg_data_{serial}_{int(time.time())}.csv"
        filepath = os.path.join(base, 'uploads', 'eeg', filename)
        df_final.to_csv(filepath, index=False)

        # 종료
        try:
            board.stop_stream()
        finally:
            board.release_session()

        print(f"[WORKER] saved: {filepath}")
        return 0

    except Exception as e:
        print(f"[WORKER][ERROR] {e}")
        traceback.print_exc()
        return 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--serial', required=True)
    parser.add_argument('--duration', type=int, default=190)
    args = parser.parse_args()
    code = run_worker(args.serial, args.duration)
    sys.exit(code)


if __name__ == '__main__':
    main()


