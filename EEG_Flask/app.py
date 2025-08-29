# -*- coding: utf-8 -*-
"""
app.py
- /health, /infer, /infer2class, /infer3class
- 요청 예:
  {
    "file_path": "/path/to/muselab.csv or .set",
    "device": "muse",            // 기본: "muse"
    "ver": "14",                 // 기본: ENV EEG_WEIGHTS_VER 또는 "14"
    "subject_id": "sub-089",     // 옵션
    "true_label": "CN",          // 옵션: "CN"|"AD"|"FTD"|("C"|"A"|"F")
    "enforce_two_minutes": true, // 기본 true
    "csv_order": "TP9,AF7,AF8,TP10" // 옵션(생략 가능). 기본은 표준 MuseLab 순서
  }
"""
import os
import time
import json
import traceback
import pandas as pd
import numpy as np
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
import openai
from dotenv import load_dotenv

# --- 엔진/채널 ---
from eeg_model3class import EEGInferenceEngine3Class as EEGEngine3, CHANNEL_GROUPS
from eeg_model2class import EEGInferenceEngine2Class as EEGEngine2
from eeg_model import EEGInferenceEngine

# .env 파일 로드
load_dotenv()

PORT = int(os.getenv("FLASK_PORT", "8000"))
app = Flask(__name__)
CORS(app)  # CORS 활성화

# 동일 (device, ver, comment, csv_order) 조합 재사용
_ENGINES2 = {}  # 2-class 캐시
_ENGINES3 = {}  # 3-class 캐시
VER = 'V1'

# OpenAI API 키 설정 (환경변수에서 가져오기)
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise ValueError("OPENAI_API_KEY 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.")


def check_place(word):
    """OpenAI GPT-4를 사용하여 장소 판별"""
    try:
        prompt = f"""
        아래 단어가 실제 주소나 위치를 나타내는 장소인지 판별해 주세요.
        
        장소(place)의 예시:
        - 집, 아파트, 빌라, 원룸, 병원, 학교, 회사, 카페, 식당, 백화점, 마트, 은행, 공원, 영화관, 체육관, 교회, 사찰, 역, 공항, 주차장 등
        
        비장소의 예시:
        - 장난감, 상상 속 공간, 물건 이름, 추상적 개념 등
        
        단어: "{word}"
        
        이 단어는 실제 위치나 장소입니까? 
        출력 형식: 장소이면 1, 장소가 아니면 0
        """
        
        print(f"[DEBUG] 장소 판별 프롬프트 전송: {prompt}")
        
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "당신은 실제 위치(주소, 건물, 시설 등)만 장소로 판별하는 전문가입니다. '집', '병원', '학교', '회사' 등은 모두 장소입니다. 장난감, 상상 속 공간, 물건 이름은 장소가 아닙니다."},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )
        
        result_text = response.choices[0].message.content.strip()
        print(f"[DEBUG] OpenAI 응답 원본: '{result_text}'")
        
        try:
            score = int(result_text)
            if score not in [0, 1]:
                print(f"[DEBUG] 점수가 0 또는 1이 아님: {score}")
                score = 0
        except ValueError as ve:
            print(f"[DEBUG] 점수 변환 실패: {ve}")
            score = 0
        
        print(f"[DEBUG] 최종 장소 판별 점수: {score}")
        return score
    except Exception as e:
        print(f"장소 판별 오류: {e}")
        traceback.print_exc()
        return 0

def _truthy(v, default=True):
    if v is None: return default
    s = str(v).strip().lower()
    return s in ("1","true","on","yes","y")

def _parse_common_params():
    p = request.get_json(force=True) or {}
    file_path = p.get("file_path")
    if not file_path:
        return None, ("file_path is required", 400)
        
    # device
    device = p.get("device")
    if isinstance(device, str) and device.strip():
        device = device.strip().lower()
        if device not in CHANNEL_GROUPS:
            return None, (f"Unsupported device '{device}'", 400)
    else:
        device = None  # 엔진이 DEFAULT_DEVICE 사용

    # ver/comment
    ver = p.get("ver")
    ver = ver.strip() if isinstance(ver, str) and ver.strip() else None
    comment = p.get("comment")
    comment = (str(comment).strip() if comment is not None else None)

    subject_id = p.get("subject_id")
    true_label = p.get("true_label")
    enforce_two_minutes = _truthy(p.get("enforce_two_minutes"), True)
        
    # Muse CSV 물리 채널 순서(옵션)
    csv_order_str = p.get("csv_order")
    csv_order = None
    if isinstance(csv_order_str, str) and csv_order_str.strip():
        items = [s.strip().upper() for s in csv_order_str.split(",") if s.strip()]
        if len(items) == 4:
            csv_order = tuple(items)
        
    parsed = {
        "file_path": file_path,
        "device": device,
        "ver": ver,
        "comment": comment,
        "subject_id": subject_id,
        "true_label": true_label,
        "enforce_two_minutes": enforce_two_minutes,
        "csv_order": csv_order
    }
    return parsed, None

def _engine3(device, ver, comment, csv_order):
    cache_key = (device or "__auto__", ver or "__auto__", comment or "__auto__", csv_order)
    eng = _ENGINES3.get(cache_key)
    if eng is None:
        eng = EEGEngine3(device_type=device, version=ver, comment=comment, csv_order=csv_order)
        _ENGINES3[cache_key] = eng
    return eng

def _engine2(device, ver, comment, csv_order):
    cache_key = (device or "__auto__", ver or "__auto__", comment or "__auto__", csv_order)
    eng = _ENGINES2.get(cache_key)
    if eng is None:
        eng = EEGEngine2(device_type=device, version=ver, comment=comment, csv_order=csv_order)
        _ENGINES2[cache_key] = eng
    return eng

def _normalize_true_label_3(tl: str | None):
    if not tl: return None
    tl = tl.strip().upper()
    if tl in ["C", "CN"]:  return "CN"
    if tl in ["A", "AD"]:  return "AD"
    if tl in ["F", "FTD"]: return "FTD"
    return tl

def _normalize_true_label_2(tl: str | None):
    if not tl: return None
    tl = tl.strip().upper()
    if tl in ["C", "CN"]: return "CN"
    if tl in ["A", "AD"]: return "AD"
    # FTD는 2진분류에서 제외
    return None

@app.get("/health")
def health():
    return jsonify({"status": "flask-ok", "routes": ["/infer(3-class)", "/infer2class(2-class)", "/infer3class(3-class)", "/check_place", "/check_moca_q3", "/check_moca_q4"]}), 200

def _infer_common(engine_kind: str):
    try:
        parsed, err = _parse_common_params()
        if err:
            msg, code = err
            return jsonify({"status":"error","error":msg}), code

        file_path       = parsed["file_path"]
        device          = parsed["device"]
        ver             = parsed["ver"]
        comment         = parsed["comment"]
        subject_id      = parsed["subject_id"]
        true_label_in   = parsed["true_label"]
        enforce_2min    = parsed["enforce_two_minutes"]
        csv_order       = parsed["csv_order"]

        if engine_kind == "2c":
            engine = _engine2(device, ver, comment, csv_order)
        else:
            engine = _engine3(device, ver, comment, csv_order)

        # 추론
        result = engine.infer(
            file_path=file_path,
            subject_id=subject_id,
            true_label=true_label_in,
            enforce_two_minutes=enforce_2min
        )
        result['class_mode'] = (2 if engine_kind == "2c" else 3)

        # subject-level 예측 레이블
        prob_mean = result.get('prob_mean', {})
        if not prob_mean:
            return jsonify({"status":"error","error":"empty prob_mean"}), 500
        subject_pred_label = max(prob_mean.items(), key=lambda x: x[1])[0]
        result['subject_pred_label'] = subject_pred_label
        
        # 정확도(옵션)
        if engine_kind == "2c":
            tl_std = _normalize_true_label_2(true_label_in)
            result['true_label'] = tl_std
            result['subject_accuracy'] = (None if tl_std is None
                                          else (1.0 if subject_pred_label == tl_std else 0.0))
        else:
            tl_std = _normalize_true_label_3(true_label_in)
            result['true_label'] = tl_std
            if tl_std is None:
                result['subject_accuracy'] = None
            else:
                result['subject_accuracy'] = 1.0 if subject_pred_label == tl_std else 0.0
        
        # 편의 필드
        result['subject_probs'] = result['prob_mean']
        
        return jsonify({"status": "ok", "result": result}), 200
        
    except FileNotFoundError as e:
        return jsonify({"status":"error","error":str(e)}), 404
    except (ValueError, AssertionError) as e:
        return jsonify({"status":"error","error":str(e)}), 400
    except HTTPException as e:
        return jsonify({"status":"error","error":f"{e.name}: {e.description}"}), e.code
    except Exception as e:
        return jsonify({"status":"error","error":repr(e)}), 500

# --- 라우트 ---
# (1) 기본 /infer: 항상 3진분류
@app.post("/infer")
def infer_default_3():
    return _infer_common("3c")

# (2) 강제 3진분류
@app.post("/infer3class")
def infer_3():
    return _infer_common("3c")

# (3) 강제 2진분류(CN/AD)
@app.post("/infer2class")
def infer_2():
    return _infer_common("2c")

# 중복된 /infer 엔드포인트 제거됨 - 위의 _infer_common 함수로 대체

@app.post("/start_eeg_collection")
def start_eeg_collection():
    """
    Muse 2 헤드밴드로 뇌파 데이터를 수집하는 엔드포인트
    """
    print(f"[DEBUG] /start_eeg_collection 엔드포인트 호출됨")
    try:
        data = request.get_json(force=True) or {}
        serial_number = data.get('serialNumber')
        
        print(f"[DEBUG] 받은 시리얼 넘버: {serial_number}")
        
        if not serial_number:
            print(f"[DEBUG] 시리얼 넘버 누락")
            return jsonify({"status":"error","error":"시리얼 넘버가 필요합니다"}), 400
        
        # 뇌파 데이터 수집 시작
        print(f"[DEBUG] 뇌파 데이터 수집 함수 호출...")
        result = run_muse2_eeg_collection(serial_number)
        print(f"[DEBUG] 뇌파 데이터 수집 완료: {result}")
        
        response_data = {
            "status": "ok",
            "message": "뇌파 데이터 수집이 시작되었습니다",
            "data_file": result.get('data_file'),
            "duration": result.get('duration'),
            "data_points": result.get('data_points'),
            "analysis_result": result.get('analysis_result')
        }
        
        print(f"[DEBUG] 응답 데이터: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"[DEBUG] 엔드포인트 오류: {str(e)}")
        import traceback
        print(f"[DEBUG] 상세 오류: {traceback.format_exc()}")
        return jsonify({"status":"error","error":str(e)}), 500

@app.route('/check_place', methods=['POST'])
def check_place_api():
    """장소 판별 API"""
    try:
        data = request.get_json()
        word = data.get('place', '')  # 'word' -> 'place'로 변경
        
        if not word:
            return jsonify({'error': '장소가 필요합니다'}), 400
        
        print(f"[DEBUG] 장소 판별 요청: {word}")
        
        # OpenAI를 사용한 장소 판별
        score = check_place(word)
        
        result = {
            'status': 'ok',
            'detected_place': score == 1,  # Frontend와 일치하도록 수정
            'score': score
        }
        
        print(f"[DEBUG] 장소 판별 결과: {result}")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"[ERROR] 장소 판별 오류: {e}")
        traceback.print_exc()
        error_response = jsonify({'error': str(e)})
        error_response.headers.add('Access-Control-Allow-Origin', '*')
        error_response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        error_response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return error_response, 500

def check_moca_q3(answer):
    """Q3: 왜 옷은 빨아 입는가? - 적절한 답변 검증"""
    prompt = f"""
    아래 답변이 MoCA Q3 질문에 적절한지 판별해 주세요.
    질문: "왜 옷은 빨아 입는가?"
    답변: "{answer}"
    출력 형식: 적절하면 1, 부적절하면 0
    """
    
    print(f"[DEBUG] MoCA Q3 프롬프트: {prompt}")
    
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "당신은 MoCA 검사 전문가입니다."},
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )
    
    result_text = response.choices[0].message.content.strip()
    print(f"[DEBUG] OpenAI 원본 응답: '{result_text}'")
    
    try:
        score = int(result_text)
        print(f"[DEBUG] 파싱된 점수: {score}")
        if score not in [0, 1]:
            print(f"[DEBUG] 점수가 0 또는 1이 아님: {score}")
            score = 0
    except Exception as e:
        print(f"[DEBUG] 점수 파싱 실패: {e}")
        score = 0
    
    print(f"[DEBUG] 최종 반환 점수: {score}")
    return score

def check_moca_q4(answer):
    """Q4: 주민등록증을 주웠을 때 주인에게 찾아주는 방법은? - 적절한 답변 검증"""
    prompt = f"""
    아래 답변이 MoCA Q4 질문에 적절한지 판별해 주세요.
    질문: "주민등록증을 주웠을 때 주인에게 찾아주는 방법은 어떤 게 있을까?"
    답변: "{answer}"
    출력 형식: 적절하면 1, 부적절하면 0
    """
    
    print(f"[DEBUG] MoCA Q4 프롬프트: {prompt}")
    
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "당신은 MoCA 검사 전문가입니다."},
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )
    
    result_text = response.choices[0].message.content.strip()
    print(f"[DEBUG] OpenAI 원본 응답: '{result_text}'")
    
    try:
        score = int(result_text)
        print(f"[DEBUG] 파싱된 점수: {score}")
        if score not in [0, 1]:
            print(f"[DEBUG] 점수가 0 또는 1이 아님: {score}")
            score = 0
    except Exception as e:
        print(f"[DEBUG] 점수 파싱 실패: {e}")
        score = 0
    
    print(f"[DEBUG] 최종 반환 점수: {score}")
    return score

@app.route('/check_moca_q3', methods=['POST'])
def check_moca_q3_api():
    """MoCA Q3 답변 검증 API"""
    try:
        data = request.get_json()
        answer = data.get('answer', '')
        if not answer:
            return jsonify({'error': '답변이 필요합니다'}), 400
        print(f"[DEBUG] MoCA Q3 검증 요청: {answer}")
        score = check_moca_q3(answer)
        result = {
            'status': 'ok',
            'answer': answer,
            'is_appropriate': score == 1,
            'score': score
        }
        print(f"[DEBUG] MoCA Q3 검증 결과: {result}")
        return jsonify(result)
    except Exception as e:
        print(f"[ERROR] MoCA Q3 검증 오류: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/check_moca_q4', methods=['POST'])
def check_moca_q4_api():
    """MoCA Q4 답변 검증 API"""
    try:
        data = request.get_json()
        answer = data.get('answer', '')
        if not answer:
            return jsonify({'error': '답변이 필요합니다'}), 400
        print(f"[DEBUG] MoCA Q4 검증 요청: {answer}")
        score = check_moca_q4(answer)
        result = {
            'status': 'ok',
            'answer': answer,
            'is_appropriate': score == 1,
            'score': score
        }
        print(f"[DEBUG] MoCA Q4 검증 결과: {result}")
        return jsonify(result)
    except Exception as e:
        print(f"[ERROR] MoCA Q4 검증 오류: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def run_muse2_eeg_collection(serial_number):
    """
    Muse 2 헤드밴드로 뇌파 데이터를 수집하는 함수
    """
    print(f"[DEBUG] 뇌파 데이터 수집 시작: 시리얼 넘버 {serial_number}")
    
    # 시뮬레이션 모드 (실제 헤드밴드 없이 테스트)
    SIMULATION_MODE = False
    
    if SIMULATION_MODE:
        print(f"[DEBUG] 시뮬레이션 모드로 실행")
        try:
            import pandas as pd
            import numpy as np
            
            # 시뮬레이션 데이터 생성 (2분 30초 = 150초, 256Hz 샘플링)
            num_points = 150 * 256
            timestamps = np.linspace(0, 150, num_points)
            
            # 랜덤한 뇌파 데이터 생성 (정상적인 범위)
            np.random.seed(42)  # 일관된 결과를 위해 시드 설정
            eeg_1 = np.random.normal(0, 100, num_points)
            eeg_2 = np.random.normal(0, 100, num_points)
            eeg_3 = np.random.normal(0, 100, num_points)
            eeg_4 = np.random.normal(0, 100, num_points)
            
            # CSV로 저장
            df_final = pd.DataFrame({
                'timestamps': timestamps,
                'eeg_1': eeg_1,
                'eeg_2': eeg_2,
                'eeg_3': eeg_3,
                'eeg_4': eeg_4
            })
            
            filename = f"eeg_data_{serial_number}_{int(time.time())}.csv"
            filepath = os.path.join("uploads", "eeg", filename)
            
            # uploads/eeg 디렉토리가 없으면 생성
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            df_final.to_csv(filepath, index=False)
            
            print(f"[DEBUG] 시뮬레이션 CSV 파일 저장 완료: {filepath}")
            print(f"[DEBUG] 데이터 포인트 수: {num_points}")
            
            # 자동으로 뇌파 분석 실행
            print(f"[DEBUG] 뇌파 분석 시작...")
            analysis_result = run_automatic_eeg_analysis(filepath, serial_number)
            print(f"[DEBUG] 뇌파 분석 완료: {analysis_result}")
            
            result = {
                'data_file': filename,
                'duration': 150,
                'data_points': num_points,
                'analysis_result': analysis_result
            }
            
            print(f"[DEBUG] 최종 결과 반환: {result}")
            return result
            
        except Exception as e:
            raise Exception(f"시뮬레이션 데이터 생성 실패: {str(e)}")
    
    # 실제 헤드밴드 모드 (Jupyter Notebook 코드 그대로 사용)
    try:
        import pandas as pd
        from time import sleep
        from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds
        
        # Jupyter Notebook 코드 그대로 복사 (input() 대신 serial_number 파라미터 사용)
        params = BrainFlowInputParams()
        params.serial_number = f"Muse-{serial_number}"  # Muse 2의 고유 시리얼 넘버
        print("설정된 시리얼 넘버:", params.serial_number)
        
        MUSE_2_BLED_BOARD = 22  #:
        MUSE_2_BOARD = 38  #:
        
        board_id = MUSE_2_BOARD
        
        board_shim = BoardShim(board_id, params)
        
        use_data_seconds = 180  # 3분 동안 데이터 수집 (AI 모델이 47개 세그먼트를 얻을 수 있는 충분한 시간) 
        sampling_rate = BoardShim.get_sampling_rate(board_id)
        num_points = use_data_seconds * sampling_rate  # 몇 초 동안 몇개의 데이터를 가져올지
        
        # Muse 2 연결
        board_shim.prepare_session()
        
        # Muse 2 데이터 수집 시작
        board_shim.start_stream()
        
        # 전극 접촉 상태 확인 (10초간)
        print("전극 접촉 상태 확인 중...")
        for i in range(10):
            try:
                contact_quality = board_shim.get_electrode_contact_quality()
                print(f"{i+1}초 - 전극 접촉 품질: {contact_quality}")
                if contact_quality:
                    electrodes = ['TP9', 'AF7', 'AF8', 'TP10']
                    for j, quality in enumerate(contact_quality):
                        status = "✅ 좋음" if quality >= 50 else "❌ 나쁨"
                        print(f"  {electrodes[j]}: {quality} ({status})")
                    if all(q >= 50 for q in contact_quality):
                        print("모든 전극 접촉 상태가 양호합니다!")
                        break
                    else:
                        print("일부 전극 접촉 상태가 불량합니다. 헤드밴드 착용을 조정해주세요.")
                else:
                    print("전극 접촉 상태를 읽을 수 없습니다.")
            except Exception as e:
                print(f"전극 접촉 상태 확인 실패: {e}")
            sleep(1)
        
        # +1초 동안 데이터 수집
        sleep(use_data_seconds + 1)  # 1초 여유를 뒀음.
        
        # 수집한 데이터를 변수에 저장
        data = board_shim.get_current_board_data(num_points)
        
        # 저장된 데이터를 알기 위한 출력 코드
        print(board_shim.get_board_descr(board_id))
        
        # CSV로 저장
        df = pd.DataFrame(data).T
        df.to_csv(f"data.csv", index=False)
        
        # Jupyter Notebook의 전처리 코드 그대로 사용
        # data.csv 파일 불러오기
        data_df = pd.read_csv('data.csv')
        
        # 1, 2, 3, 4열 (채널 데이터)과 6열 (timestamps)을 선택합니다.
        data_df_cleaned = data_df[['1', '2', '3', '4', '6']].copy()
        
        # 컬럼 명 변경
        data_df_cleaned.rename(columns={'1': 'eeg_1', '2': 'eeg_2', '3': 'eeg_3', '4': 'eeg_4', '6': 'timestamps'}, inplace=True)
        
        # 컬럼 순서 변경 timestamps, eeg_1, eeg_2, eeg_3, eeg_4
        df_final = data_df_cleaned[['timestamps', 'eeg_1', 'eeg_2', 'eeg_3', 'eeg_4']]
        
        # 최종 CSV 저장
        filename = f"eeg_data_{serial_number}_{int(time.time())}.csv"
        filepath = os.path.join("uploads", "eeg", filename)
        
        # uploads/eeg 디렉토리가 없으면 생성
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        df_final.to_csv(filepath, index=False)
        
        # Muse 2 데이터 수집 정지
        board_shim.stop_stream()
        
        # Muse 2 연결 해제
        board_shim.release_session()
        
        print(f"[DEBUG] CSV 파일 저장 완료: {filepath}")
        print(f"[DEBUG] 데이터 포인트 수: {len(data[0])}")
        
        # 자동으로 뇌파 분석 실행
        print(f"[DEBUG] 뇌파 분석 시작...")
        analysis_result = run_automatic_eeg_analysis(filepath, serial_number)
        print(f"[DEBUG] 뇌파 분석 완료: {analysis_result}")
        
        result = {
            'data_file': filename,
            'duration': use_data_seconds,
            'data_points': len(data[0]),
            'analysis_result': analysis_result
        }
        
        print(f"[DEBUG] 최종 결과 반환: {result}")
        return result
        
    except Exception as e:
        raise Exception(f"뇌파 데이터 수집 실패: {str(e)}")

def run_automatic_eeg_analysis(file_path, serial_number):
    """
    수집된 뇌파 데이터를 자동으로 분석하는 함수 (2-class 모델 사용)
    """
    print(f"[DEBUG] 뇌파 분석 시작: {file_path}")
    print(f"[DEBUG] 시리얼 넘버: {serial_number}")
    
    try:
        print(f"[DEBUG] 2-class EEGInferenceEngine 사용...")
        # 2-class 엔진 사용
        device = "muse"
        ver = "53"
        csv_order = None
        
        # 2-class 엔진 캐시 키
        cache_key = (device, ver, csv_order)
        engine = _ENGINES2.get(cache_key)
        if engine is None:
            print(f"[DEBUG] 새로운 2-class EEGInferenceEngine 생성...")
            engine = EEGEngine2(device_type=device, version=ver, csv_order=csv_order)
            _ENGINES2[cache_key] = engine
            print(f"[DEBUG] 2-class EEGInferenceEngine 생성 완료")
        else:
            print(f"[DEBUG] 기존 캐시된 2-class EEGInferenceEngine 사용")
        
        print(f"[DEBUG] 2-class 분석 실행 시작...")
        # 2-class 분석 실행
        result = engine.infer(file_path=file_path, subject_id=f"sub-{serial_number}", enforce_two_minutes=True)
        print(f"[DEBUG] 2-class 분석 실행 완료: {result}")
        
        # 2-class 결과 정리
        prob_mean = result['prob_mean']
        subject_pred_label = max(prob_mean.items(), key=lambda x: x[1])[0]
        result['subject_pred_label'] = subject_pred_label
        
        # 2-class 결과를 사용자 친화적으로 변환
        if 'CN' in prob_mean and 'AD' in prob_mean:
            # CN/AD 형태인 경우
            if subject_pred_label == 'CN':
                user_friendly_label = '정상'
            else:
                user_friendly_label = '비정상'
        elif 'Normal' in prob_mean and 'Abnormal' in prob_mean:
            # Normal/Abnormal 형태인 경우
            if subject_pred_label == 'Normal':
                user_friendly_label = '정상'
            else:
                user_friendly_label = '비정상'
        else:
            # 기타 형태인 경우
            user_friendly_label = subject_pred_label
        
        analysis_result = {
            'status': 'success',
            'subject_id': f"sub-{serial_number}",
            'predicted_label': subject_pred_label,
            'user_friendly_label': user_friendly_label,
            'probabilities': prob_mean,
            'confidence': max(prob_mean.values()) if prob_mean else 0,
            'analysis_time': time.strftime('%Y-%m-%d %H:%M:%S'),
            'file_path': file_path,
            'model_type': '2-class'
        }
        
        print(f"[DEBUG] 2-class 분석 결과 정리 완료: {analysis_result}")
        return analysis_result
        
    except Exception as e:
        print(f"[DEBUG] 분석 중 오류 발생: {str(e)}")
        print(f"[DEBUG] 오류 타입: {type(e)}")
        import traceback
        print(f"[DEBUG] 상세 오류: {traceback.format_exc()}")
        
        # 분석 실패 시에도 기본 정보 반환
        return {
            'status': 'failed',
            'error': str(e),
            'subject_id': f"sub-{serial_number}",
            'analysis_time': time.strftime('%Y-%m-%d %H:%M:%S'),
            'file_path': file_path
        }

@app.get("/eeg_progress")
def eeg_progress():
    """
    뇌파 데이터 수집 진행 상황을 확인하는 엔드포인트
    """
    # 실제 구현에서는 세션이나 데이터베이스에서 진행 상황을 확인
    # 현재는 간단한 예시로 반환
    return jsonify({
        "status": "ok",
        "progress": 100,  # 0-100 사이의 값
        "status_message": "데이터 수집 완료"
    })

if __name__ == "__main__":
    # 디버그 서버는 단일 스레드라 캐시 race 이슈가 없지만,
    # 운영 시에는 WSGI(예: gunicorn) 사용을 권장드립니다.
    app.run(host="0.0.0.0", port=PORT, debug=False)