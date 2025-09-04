// 검사 결과를 백엔드 DB에 저장하는 유틸리티

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
 * 검사 결과를 수동으로 저장 (Results 페이지에서 사용)
 * @param eegResult 뇌파 분석 결과
 * @param mocaScore MOCA 점수
 * @param mmseScore MMSE 점수
 */
export const saveAssessment = async (
  eegResult: any,
  mocaScore: number = 0,
  mmseScore: number = 0
): Promise<boolean> => {
  console.log('🔍 saveAssessment 호출됨:', { eegResult, mocaScore, mmseScore });
  
  if (!eegResult) {
    console.log('뇌파 검사 결과가 없어 저장하지 않습니다.');
    return false;
  }
  
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
      case 'MCI': eegDiagnosis = 'mci'; break;
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
    console.log('🎉 검사 결과 저장 완료!');
    // 세션 스토리지에 저장 완료 상태 기록
    sessionStorage.setItem('assessment_saved', 'true');
    // 저장 시간 기록
    const currentTime = new Date().getTime();
    sessionStorage.setItem('last_saved_timestamp', currentTime.toString());
    console.log('📅 저장 시간 기록됨:', new Date(currentTime).toLocaleString());
  } else {
    console.error('💥 검사 결과 저장 실패!');
  }
  
  return success;
};
