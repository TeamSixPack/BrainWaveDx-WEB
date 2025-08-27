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
    
    const response = await fetch('http://localhost:8090/api/assessment/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        userId: data.userId,
        eegResult: data.eegResult,
        mocaScore: data.mocaScore?.toString() || '',
        mmseScore: data.mmseScore?.toString() || ''
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('✅ 검사 결과가 DB에 성공적으로 저장되었습니다!');
        return true;
      } else {
        console.error('❌ DB 저장 실패:', result.message);
        return false;
      }
    } else {
      console.error('❌ DB 저장 요청 실패:', response.status);
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
): Promise<void> => {
  if (!eegResult) {
    console.log('뇌파 검사 결과가 없어 저장하지 않습니다.');
    return;
  }
  
  // 뇌파 진단 결과 결정
  let eegDiagnosis = 'normal';
  if (eegResult.probabilities || eegResult.prob_mean) {
    const probabilities = eegResult.probabilities || eegResult.prob_mean;
    const highestProbLabel = Object.entries(probabilities).reduce((a, b) => 
      Number(probabilities[a[0]]) > Number(probabilities[b[0]]) ? a : b
    )[0];
    
    switch (highestProbLabel) {
      case 'CN': eegDiagnosis = 'normal'; break;
      case 'AD': eegDiagnosis = 'dementia'; break;
      case 'FTD': eegDiagnosis = 'mci'; break;
      default: eegDiagnosis = 'normal'; break;
    }
  }
  
  const assessmentData: AssessmentData = {
    userId: 'test', // 실제로는 로그인된 사용자 ID
    eegResult: convertDiagnosisToKorean(eegDiagnosis),
    mocaScore: mocaScore > 0 ? mocaScore : undefined,
    mmseScore: mmseScore > 0 ? mmseScore : undefined
  };
  
  const success = await saveAssessmentToDB(assessmentData);
  
  if (success) {
    console.log('🎉 검사 결과 자동 저장 완료!');
  } else {
    console.error('💥 검사 결과 자동 저장 실패!');
  }
};
