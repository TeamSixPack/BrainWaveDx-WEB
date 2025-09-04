// Assessment data storage service for managing test history
export interface StoredAssessment {
  id: string;
  patientName: string;
  assessmentDate: string;
  diagnosis: "normal" | "mci" | "dementia";
  confidenceLevel: number;
  eegAnalysis: {
    overallScore: number;
    alphaWaves: { value: number; status: string; description: string };
    betaWaves: { value: number; status: string; description: string };
    thetaWaves: { value: number; status: string; description: string };
    deltaWaves: { value: number; status: string; description: string };
    asymmetryIndex: number;
    overallCoherence: number;
  };
  cognitiveTest: {
    overallScore: number;
    memoryScore: number;
    attentionScore: number;
    processingScore: number;
    spatialScore: number;
    executiveScore: number;
    details: Array<{
      mission: string;
      score: number;
      description: string;
    }>;
  };
  riskFactors: {
    mciRisk: number;
    dementiaRisk: number;
    overallRisk: string;
  };
}

export class AssessmentStorageService {
  private static readonly STORAGE_KEY = 'neuroscan_assessments';

  // 새로운 검사 결과 저장
  static saveAssessment(assessment: Omit<StoredAssessment, 'id'>): StoredAssessment {
    const assessments = this.getAllAssessments();
    const newAssessment: StoredAssessment = {
      ...assessment,
      id: this.generateId(),
    };
    
    assessments.unshift(newAssessment); // 최신 순으로 정렬
    this.saveToStorage(assessments);
    
    return newAssessment;
  }

  // 모든 검사 기록 조회
  static getAllAssessments(): StoredAssessment[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('검사 기록 로드 오류:', error);
      return [];
    }
  }

  // 특정 검사 기록 조회
  static getAssessment(id: string): StoredAssessment | null {
    const assessments = this.getAllAssessments();
    return assessments.find(assessment => assessment.id === id) || null;
  }

  // 최근 검사 기록 조회
  static getLatestAssessment(): StoredAssessment | null {
    const assessments = this.getAllAssessments();
    return assessments.length > 0 ? assessments[0] : null;
  }

  // 검사 기록 삭제
  static deleteAssessment(id: string): boolean {
    const assessments = this.getAllAssessments();
    const filteredAssessments = assessments.filter(assessment => assessment.id !== id);
    
    if (filteredAssessments.length !== assessments.length) {
      this.saveToStorage(filteredAssessments);
      return true;
    }
    
    return false;
  }

  // 두 검사 결과 비교
  static compareAssessments(currentId: string, previousId: string): AssessmentComparison | null {
    const current = this.getAssessment(currentId);
    const previous = this.getAssessment(previousId);
    
    if (!current || !previous) return null;

    return {
      current,
      previous,
      differences: this.calculateDifferences(current, previous),
      timeGap: this.calculateTimeGap(current.assessmentDate, previous.assessmentDate)
    };
  }

  // 검사 점수 변화 계산
  private static calculateDifferences(current: StoredAssessment, previous: StoredAssessment): AssessmentDifferences {
    return {
      eegOverallScore: current.eegAnalysis.overallScore - previous.eegAnalysis.overallScore,
      cognitiveOverallScore: current.cognitiveTest.overallScore - previous.cognitiveTest.overallScore,
      memoryScore: current.cognitiveTest.memoryScore - previous.cognitiveTest.memoryScore,
      attentionScore: current.cognitiveTest.attentionScore - previous.cognitiveTest.attentionScore,
      processingScore: current.cognitiveTest.processingScore - previous.cognitiveTest.processingScore,
      spatialScore: current.cognitiveTest.spatialScore - previous.cognitiveTest.spatialScore,
      executiveScore: current.cognitiveTest.executiveScore - previous.cognitiveTest.executiveScore,
      mciRisk: current.riskFactors.mciRisk - previous.riskFactors.mciRisk,
      dementiaRisk: current.riskFactors.dementiaRisk - previous.riskFactors.dementiaRisk,
      confidenceLevel: current.confidenceLevel - previous.confidenceLevel,
      alphaWaves: current.eegAnalysis.alphaWaves.value - previous.eegAnalysis.alphaWaves.value,
      betaWaves: current.eegAnalysis.betaWaves.value - previous.eegAnalysis.betaWaves.value,
      thetaWaves: current.eegAnalysis.thetaWaves.value - previous.eegAnalysis.thetaWaves.value,
      deltaWaves: current.eegAnalysis.deltaWaves.value - previous.eegAnalysis.deltaWaves.value,
    };
  }

  // 날짜 간격 계산
  private static calculateTimeGap(currentDate: string, previousDate: string): string {
    const current = new Date(currentDate);
    const previous = new Date(previousDate);
    const diffTime = Math.abs(current.getTime() - previous.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}주 전`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}개월 전`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years}년 전`;
    }
  }

  // 로컬 스토리지에 저장
  private static saveToStorage(assessments: StoredAssessment[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(assessments));
    } catch (error) {
      console.error('검사 기록 저장 오류:', error);
    }
  }

  // 고유 ID 생성
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 통계 조회
  static getAssessmentStats(): AssessmentStats {
    const assessments = this.getAllAssessments();
    
    if (assessments.length === 0) {
      return {
        totalAssessments: 0,
        averageEegScore: 0,
        averageCognitiveScore: 0,
        latestDiagnosis: null,
        improvementTrend: 'stable'
      };
    }

    const totalEegScore = assessments.reduce((sum, assessment) => sum + assessment.eegAnalysis.overallScore, 0);
    const totalCognitiveScore = assessments.reduce((sum, assessment) => sum + assessment.cognitiveTest.overallScore, 0);
    
    let improvementTrend: 'improving' | 'declining' | 'stable' = 'stable';
    
    if (assessments.length >= 2) {
      const latest = assessments[0];
      const previous = assessments[1];
      const scoreDiff = (latest.eegAnalysis.overallScore + latest.cognitiveTest.overallScore) - 
                       (previous.eegAnalysis.overallScore + previous.cognitiveTest.overallScore);
      
      if (scoreDiff > 5) improvementTrend = 'improving';
      else if (scoreDiff < -5) improvementTrend = 'declining';
    }

    return {
      totalAssessments: assessments.length,
      averageEegScore: Math.round(totalEegScore / assessments.length),
      averageCognitiveScore: Math.round(totalCognitiveScore / assessments.length),
      latestDiagnosis: assessments[0].diagnosis,
      improvementTrend
    };
  }
}

export interface AssessmentComparison {
  current: StoredAssessment;
  previous: StoredAssessment;
  differences: AssessmentDifferences;
  timeGap: string;
}

export interface AssessmentDifferences {
  eegOverallScore: number;
  cognitiveOverallScore: number;
  memoryScore: number;
  attentionScore: number;
  processingScore: number;
  spatialScore: number;
  executiveScore: number;
  mciRisk: number;
  dementiaRisk: number;
  confidenceLevel: number;
  alphaWaves: number;
  betaWaves: number;
  thetaWaves: number;
  deltaWaves: number;
}

export interface AssessmentStats {
  totalAssessments: number;
  averageEegScore: number;
  averageCognitiveScore: number;
  latestDiagnosis: "normal" | "mci" | "dementia" | null;
  improvementTrend: 'improving' | 'declining' | 'stable';
}