// 검사 결과를 백엔드 DB에 자동 저장하는 유틸리티

export interface AssessmentData {
  userId: string;
  eegResult: string;
  mocaScore?: number;
  mmseScore?: number;
}

/**
 * 검사 결과를 백엔드 DB에 저장
 * @param data 저장할 검사 데이터
 * @returns 저장 성공 여부
 */
export const saveAssessmentToDB = async (data: AssessmentData): Promise<boolean> => {
  try {
    console.log('🔵 검사 결과를 DB에 저장 중...', data);
    
    const response = await fetch('http://localhost:8090/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: data.userId,
        eegResult: data.eegResult,
        mocaScore: data.mocaScore,
        mmseScore: data.mmseScore
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('✅ 검사 결과가 DB에 성공적으로 저장되었습니다!');
        return true;
      } else {
        console.error('❌ DB 저장 실패:', result.message);
        console.error('❌ 응답 데이터:', result);
        return false;
      }
    } else {
      console.error('❌ DB 저장 요청 실패:', response.status);
      console.error('❌ 응답 텍스트:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ DB 저장 중 오류 발생:', error);
    return false;
  }
};

/**
 * 뇌파 진단 결과를 한글로 변환
 * @param diagnosis 영문 진단 결과
 * @returns 한글 진단 결과
 */
export const convertDiagnosisToKorean = (diagnosis: string): string => {
  switch (diagnosis.toLowerCase()) {
    case 'normal':
    case 'cn':
      return '정상';
    case 'mci':
    case 'ftd':
      return '전측두엽장애';
    case 'dementia':
    case 'ad':
      return '치매';
    default:
      return '정상';
  }
};

/**
 * 검사 완료 후 자동 저장 (Results 페이지에서 사용)
 * @param eegResult 뇌파 분석 결과
 * @param mocaScore MOCA 점수
 * @param mmseScore MMSE 점수
 */
export const autoSaveAssessment = async (
  eegResult: any,
  mocaScore: number = 0,
  mmseScore: number = 0
): Promise<boolean> => {
  console.log('🔍 autoSaveAssessment 호출됨:', { eegResult, mocaScore, mmseScore });
  
  if (!eegResult) {
    console.log('뇌파 검사 결과가 없어 저장하지 않습니다.');
    return false;
  }

  // 시간 기반 중복 저장 방지 제거 (해시 기반만 사용)
  // const lastSavedTime = sessionStorage.getItem('last_saved_timestamp');
  // const currentTime = new Date().getTime();
  // const timeDiff = lastSavedTime ? currentTime - parseInt(lastSavedTime) : Infinity;
  // const fiveMinutes = 5 * 60 * 1000; // 5분을 밀리초로
  
  // console.log('🔍 시간 기반 중복 저장 방지 체크:');
  // console.log('  - 마지막 저장 시간:', lastSavedTime ? new Date(parseInt(lastSavedTime)).toLocaleString() : '없음');
  // console.log('  - 현재 시간:', new Date(currentTime).toLocaleString());
  // console.log('  - 시간 차이:', Math.round(timeDiff / 1000 / 60), '분');
  // console.log('  - 5분 경과:', timeDiff >= fiveMinutes);
  
  // 5분 이내에 저장된 기록이 있으면 중복 저장 방지 (비활성화)
  // if (lastSavedTime && timeDiff < fiveMinutes) {
  //   console.log('⚠️ autoSaveAssessment: 5분 이내에 이미 저장된 기록이 있습니다.');
  //   console.log('💡 5분 후에 다시 시도해주세요');
  //   console.log('⏰ 남은 시간:', Math.round((fiveMinutes - timeDiff) / 1000 / 60), '분', Math.round((fiveMinutes - timeDiff) / 1000 % 60), '초');
  //   return true; // 이미 저장된 것으로 간주
  // }
  
  // 해시 기반 중복 저장 방지 (정확한 중복 방지)
  const resultHash = JSON.stringify({
    predicted_label: eegResult.predicted_label,
    mocaScore,
    mmseScore,
    timestamp: eegResult.analysis_time || new Date().toISOString()
  });
  
  const savedHash = sessionStorage.getItem('last_saved_result_hash');
  console.log('🔍 해시 기반 중복 저장 방지 체크:');
  console.log('  - 현재 해시:', resultHash);
  console.log('  - 저장된 해시:', savedHash);
  console.log('  - 해시 일치:', savedHash === resultHash);
  
  // 정확히 동일한 결과는 절대 저장하지 않음
  if (savedHash === resultHash) {
    console.log('⚠️ autoSaveAssessment: 정확히 동일한 검사 결과입니다. 저장하지 않습니다.');
    return true; // 이미 저장된 것으로 간주
  }
  
  // 강제 저장 플래그는 더 이상 사용하지 않음 (시간 기반 방지만 사용)
  // const forceSave = sessionStorage.getItem('force_save_assessment') === 'true';
  
  // 강제 저장 플래그 관련 로직 제거
  // if (forceSave && lastSavedTime && timeDiff < tenMinutes) {
  //   console.log('⚠️ autoSaveAssessment: 강제 저장 플래그가 설정되어 있지만 10분 이내라서 무시합니다.');
  //   console.log('⏰ 남은 시간:', Math.round((tenMinutes - timeDiff) / 1000 / 60), '분', Math.round((tenMinutes - timeDiff) / 1000 % 60), '초');
  //   console.log('🔒 시간 기반 방지가 강제 저장 플래그보다 우선합니다.');
  //   return true; // 강제 저장 플래그 무시
  // }
  
  // 해시 기반 중복 방지 일시 비활성화 (시간 기반만 사용)
  // if (savedHash === resultHash) {
  //   console.log('⚠️ autoSaveAssessment: 이미 저장된 동일한 검사 결과입니다.');
  //   console.log('💡 시간 기반 방지가 적용되어 1분 이내에는 저장되지 않습니다.');
  //   return true; // 이미 저장된 것으로 간주
  // }
  
  // 강제 저장 플래그는 더 이상 사용하지 않음 (시간 기반 방지만 사용)
  // if (forceSave) {
  //   sessionStorage.removeItem('force_save_assessment');
  //   sessionStorage.removeItem('last_saved_result_hash');
  //   sessionStorage.removeItem('last_saved_timestamp');
  //   console.log('🔧 강제 저장 모드로 중복 저장 방지 해제 (해시 + 타임스탬프 제거)');
  // }
  
  // 뇌파 진단 결과 결정
  let eegDiagnosis = 'normal';
  if (eegResult.probabilities || eegResult.prob_mean) {
    const probabilities = eegResult.probabilities || eegResult.prob_mean;
    console.log('🔍 뇌파 확률 데이터:', probabilities);
    
    const highestProbLabel = Object.entries(probabilities).reduce((a, b) => 
      Number(probabilities[a[0]]) > Number(probabilities[b[0]]) ? a : b
    )[0];
    
    console.log('🔍 최고 확률 라벨:', highestProbLabel);
    
    switch (highestProbLabel) {
      case 'CN': eegDiagnosis = 'normal'; break;
      case 'AD': eegDiagnosis = 'dementia'; break;
      case 'FTD': eegDiagnosis = 'mci'; break;
      default: eegDiagnosis = 'normal'; break;
    }
  }
  
  console.log('🔍 결정된 진단:', eegDiagnosis);
  
  const assessmentData: AssessmentData = {
    userId: 'test', // 실제로는 로그인된 사용자 ID
    eegResult: convertDiagnosisToKorean(eegDiagnosis),
    mocaScore: mocaScore > 0 ? mocaScore : undefined,
    mmseScore: mmseScore > 0 ? mmseScore : undefined
  };
  
  console.log('🔍 최종 저장 데이터:', assessmentData);
  
  const success = await saveAssessmentToDB(assessmentData);
  
  if (success) {
    console.log('🎉 검사 결과 자동 저장 완료!');
    // 세션 스토리지에 저장 완료 상태 기록
    sessionStorage.setItem('assessment_saved', 'true');
    // 저장 시간 기록 (5분 중복 저장 방지용)
    const currentTime = new Date().getTime();
    sessionStorage.setItem('last_saved_timestamp', currentTime.toString());
    console.log('📅 저장 시간 기록됨:', new Date(currentTime).toLocaleString());
  } else {
    console.error('💥 검사 결과 자동 저장 실패!');
  }
  
  return success;
};
