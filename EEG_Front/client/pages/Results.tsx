import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { PDFService, type AssessmentData } from "@/lib/pdf-service";
import { AssessmentStorageService } from "@/lib/assessment-storage";
import { autoSaveAssessment } from "@/lib/assessment-save";
import Chatbot from "@/components/Chatbot";
import { useAuth } from "@/lib/auth-context";
import {
  Brain,
  Activity,
  Download,
  FileText,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Target,
  MessageCircle,
  Bot,
  Utensils,
  History
} from "lucide-react";

type DiagnosisResult = "normal" | "mci" | "dementia";

export default function Results() {
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [assessmentSaved, setAssessmentSaved] = useState(() => {
    // 세션 스토리지에서 저장 상태 확인
    const saved = sessionStorage.getItem('assessment_saved');
    return saved === 'true';
  });

  // assessmentSaved 상태를 업데이트할 때 세션 스토리지도 함께 업데이트
  const updateAssessmentSaved = useCallback((saved: boolean) => {
    setAssessmentSaved(saved);
    sessionStorage.setItem('assessment_saved', saved.toString());
  }, []);
  
  // 툴팁 위치 조정을 위한 상태
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
  
  // URL 파라미터에서 MOCA 점수와 MMSE 점수 읽어오기
  const { mocaScore, mmseScore } = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const moca = parseInt(urlParams.get('mocaScore') || '0');
    const mmse = parseInt(urlParams.get('mmseScore') || '0');
    
    // 디버깅을 위한 콘솔 로그 (한 번만 실행)
    console.log('URL 파라미터:', window.location.search);
    console.log('MOCA 점수:', moca);
    console.log('MMSE 점수:', mmse);
    console.log('MOCA 점수 타입:', typeof moca);
    console.log('MMSE 점수 타입:', typeof mmse);
    
    return { mocaScore: moca, mmseScore: mmse };
  }, []); // 빈 의존성 배열로 한 번만 실행

  // EegTest에서 전달받은 뇌파 분석 결과
  const location = useLocation();
  const eegResult = useMemo(() => location.state?.eegResult, [location.state?.eegResult]);
  
  // 자동 분석 결과 (세션 스토리지에서 가져오기)
  const [autoEegResult, setAutoEegResult] = useState<any>(null);
  const [personalizedGuide, setPersonalizedGuide] = useState<any>(null);
  
  // 무한 루프 방지를 위한 ref
  const hasInitialized = useRef(false);
  
  // 자동 분석 결과가 있으면 그것을 우선 사용, 없으면 기존 결과 사용
  const finalEegResult = useMemo(() => {
    const result = autoEegResult || eegResult;
    console.log('🔍 finalEegResult 계산됨:', result);
    console.log('🔍 autoEegResult:', autoEegResult);
    console.log('🔍 eegResult:', eegResult);
    return result;
  }, [autoEegResult, eegResult]);
  
  // 뇌파 분석 결과가 있으면 가장 높은 확률값을 신뢰도로 사용, 없으면 기본값 사용
  const actualConfidenceLevel = useMemo(() => {
    return finalEegResult 
      ? Math.round(Math.max(...Object.values(finalEegResult.probabilities || finalEegResult.prob_mean || {}).map(v => Number(v))) * 100)
      : 87;
  }, [finalEegResult]);

  // 뇌파 분석 결과에 따른 진단 결정
  const getDiagnosisFromEeg = (eegResult: any): DiagnosisResult => {
    if (!eegResult) return "normal";
    
    // 확률이 가장 높은 라벨을 사용
    const getHighestProbLabel = (probMean: Record<string, number>) => {
      return Object.entries(probMean).reduce((a, b) => 
        Number(probMean[a[0]]) > Number(probMean[b[0]]) ? a : b
      )[0];
    };
    
    // 자동 분석 결과와 기존 결과 모두 처리
    const probabilities = eegResult.probabilities || eegResult.prob_mean;
    if (!probabilities) return "normal";
    
    const highestProbLabel = getHighestProbLabel(probabilities);
    
    switch (highestProbLabel) {
      case 'CN': return "normal";
      case 'AD': return "dementia";
      case 'FTD': return "dementia";
      default: return "normal";
    }
  };

  useEffect(() => {
    // 이미 초기화되었으면 실행하지 않음
    if (hasInitialized.current) {
      return;
    }
    
    hasInitialized.current = true;
    
    console.log('🔍 useEffect 실행됨 (한 번만)');
    console.log('🔍 finalEegResult:', finalEegResult);
    console.log('🔍 assessmentSaved:', assessmentSaved);
    console.log('🔍 mocaScore:', mocaScore);
    console.log('🔍 mmseScore:', mmseScore);
    
    // 세션 스토리지에서 자동 분석 결과 확인
    const storedResult = sessionStorage.getItem('eeg_analysis_result');
    console.log('🔍 세션 스토리지 결과:', storedResult);
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        setAutoEegResult(parsedResult);
        console.log('자동 분석 결과 로드됨:', parsedResult);
        
        // 자동 분석 결과가 로드되면 맞춤형 가이드 생성
        const guide = getPersonalizedGuide(parsedResult);
        setPersonalizedGuide(guide);
        console.log('맞춤형 가이드 생성됨:', guide);
      } catch (error) {
        console.error('자동 분석 결과 파싱 오류:', error);
      }
    }
  }, []); // 의존성 배열을 비워서 한 번만 실행

  // 뇌파 검사 결과에 따른 맞춤형 가이드 데이터
  const getPersonalizedGuide = (eegResult: any) => {
    console.log('[DEBUG] getPersonalizedGuide 호출됨, eegResult:', eegResult);
    if (!eegResult) {
      console.log('[DEBUG] eegResult가 null/undefined');
      return null;
    }
    
    const getHighestProbLabel = (probMean: Record<string, number>) => {
      return Object.entries(probMean).reduce((a, b) => 
        Number(probMean[a[0]]) > Number(probMean[b[0]]) ? a : b
      )[0];
    };
    
    // 자동 분석 결과와 기존 결과 모두 처리
    const probabilities = eegResult.probabilities || eegResult.prob_mean;
    if (!probabilities) return null;
    
    const highestProbLabel = getHighestProbLabel(probabilities);
    
    // 맞춤형 가이드 데이터 반환
    switch (highestProbLabel) {
      case 'CN':
        return {
          title: "정상 뇌파 패턴",
          color: "text-green-600",
          guides: {
            food: {
              title: "뇌 건강을 위한 식단",
              items: [
                "오메가-3가 풍부한 생선 (연어, 고등어, 청어)",
                "항산화 물질이 풍부한 베리류 (블루베리, 딸기, 라즈베리)",
                "전곡류 (현미, 귀리, 퀴노아)",
                "견과류 (호두, 아몬드, 브라질넛)",
                "잎채소 (시금치, 케일, 브로콜리)"
              ]
            },
            exercise: {
              title: "뇌 활성화 운동",
              items: [
                "유산소 운동 (걷기, 조깅, 수영) - 주 3-4회, 30분",
                "근력 운동 (스쿼트, 플랭크, 푸시업) - 주 2-3회",
                "균형 운동 (요가, 타이치) - 주 2-3회",
                "댄스나 테니스 같은 복합 운동"
              ]
            },
            behavior: {
              title: "뇌 건강 습관",
              items: [
                "규칙적인 수면 (7-8시간)",
                "스트레스 관리 (명상, 호흡 운동)",
                "사회적 활동 (친구와의 만남, 취미 활동)",
                "새로운 기술 학습 (언어, 악기, 요리)"
              ]
            }
          }
        };
      case 'AD':
        return {
          title: "알츠하이머 치매 패턴",
          color: "text-red-600",
          guides: {
            food: {
              title: "치매 예방 식단",
              items: [
                "MIND 다이어트 (지중해식 + DASH 다이어트)",
                "항산화 물질 (비타민 E, C, 베타카로틴)",
                "오메가-3 지방산 (생선, 호두, 아마씨)",
                "비타민 B군 (전곡류, 계란, 녹색채소)",
                "항염증 식품 (강황, 생강, 마늘)"
              ]
            },
            exercise: {
              title: "인지 기능 향상 운동",
              items: [
                "가벼운 유산소 운동 (걷기) - 매일 30분",
                "스트레칭과 요가 - 주 3-4회",
                "손가락 운동 (뜨개질, 퍼즐)",
                "균형 운동 (한 발로 서기, 뒤로 걷기)"
              ]
            },
            behavior: {
              title: "인지 기능 보호",
              items: [
                "규칙적인 생활 리듬",
                "충분한 수면 (8-9시간)",
                "정신적 자극 (독서, 퍼즐, 게임)",
                "가족과의 대화 및 사회적 활동"
              ]
            }
          }
        };
      case 'FTD':
        return {
          title: "전두측두엽 치매 패턴",
          color: "text-orange-600",
          guides: {
            food: {
              title: "전두엽 기능 향상 식단",
              items: [
                "고품질 단백질 (닭고기, 생선, 콩)",
                "복합 탄수화물 (현미, 귀리, 퀴노아)",
                "뇌 에너지 공급 (코코넛 오일, MCT 오일)",
                "항산화 물질 (베리류, 다크 초콜릿)",
                "오메가-3 지방산 (생선, 아마씨)"
              ]
            },
            exercise: {
              title: "집행 기능 향상 운동",
              items: [
                "복합 운동 (테니스, 배드민턴)",
                "춤추기 (댄스, 줌바)",
                "요가와 필라테스",
                "자연 속 걷기 (숲길, 공원)"
              ]
            },
            behavior: {
              title: "집행 기능 훈련",
              items: [
                "계획 세우기 (일정표 작성)",
                "문제 해결 게임 (체스, 퍼즐)",
                "새로운 언어나 악기 학습",
                "정리 정돈 습관 형성"
              ]
            }
          }
        };
      default:
        return null;
    }
  };

  // Mock comprehensive results data
  const results = useMemo(() => ({
    patientName: "Test User", // In real app, get from auth
    assessmentDate: new Date().toISOString(),
    diagnosis: getDiagnosisFromEeg(finalEegResult),
    confidenceLevel: actualConfidenceLevel,
    eegAnalysis: {
      overallScore: 92,
      alphaWaves: { value: 78, status: "normal", description: "Well-balanced alpha activity indicating good relaxed awareness" },
      betaWaves: { value: 82, status: "normal", description: "Healthy beta waves showing active cognitive processing" },
      thetaWaves: { value: 45, status: "slightly_elevated", description: "Slightly elevated theta activity, within normal range" },
      deltaWaves: { value: 23, status: "normal", description: "Normal delta wave patterns indicating healthy sleep-wake cycles" },
      asymmetryIndex: 0.12,
      overallCoherence: 0.78
    },
    cognitiveTest: {
      mocaScore: mocaScore,
      mmseScore: mmseScore,
      mocaResult: mocaScore >= 21 ? "정상" : "경도인지장애",
      mmseResult: mmseScore >= 24 ? "정상" : mmseScore >= 18 ? "경도인지장애" : "인지기능장애",
      details: [
        { test: "종합 인지 평가", score: mocaScore, maxScore: 30, result: mocaScore >= 21 ? "정상" : "경도인지장애", description: mocaScore >= 21 ? "21점 이상으로 정상 범위" : "20점 이하로 경도인지장애" },
        { test: "간이 인지 검사", score: mmseScore, maxScore: 30, result: mmseScore >= 24 ? "정상" : mmseScore >= 18 ? "경도인지장애" : "인지기능장애", description: mmseScore >= 24 ? "24점 이상으로 인지적 손상 없음" : mmseScore >= 18 ? "23~18점으로 경도인지장애" : "17점 이하로 인지기능장애" }
      ]
    }
  }), [finalEegResult, actualConfidenceLevel, mocaScore, mmseScore]);

  // 검사 결과가 있으면 자동으로 DB에 저장
  useEffect(() => {
    console.log('🔍 자동 저장 useEffect 실행됨');
    console.log('🔍 finalEegResult:', finalEegResult);
    console.log('🔍 assessmentSaved:', assessmentSaved);
    console.log('🔍 mocaScore:', mocaScore);
    console.log('🔍 mmseScore:', mmseScore);
    
    // 검사 결과가 있고 아직 저장되지 않았으면 자동으로 DB에 저장
    if (finalEegResult && !assessmentSaved) {
      // 중복 저장 방지를 위한 고유 식별자 생성
      const resultHash = JSON.stringify({
        predicted_label: finalEegResult.predicted_label,
        mocaScore,
        mmseScore,
        timestamp: finalEegResult.analysis_time || new Date().toISOString()
      });
      
      // 이미 저장된 결과인지 확인
      const savedHash = sessionStorage.getItem('last_saved_result_hash');
      if (savedHash === resultHash) {
        console.log('⚠️ 이미 저장된 동일한 검사 결과입니다. 중복 저장을 건너뜁니다.');
        updateAssessmentSaved(true);
        return;
      }
      
      console.log('🔵 검사 완료! 자동으로 DB에 저장합니다...');
      console.log('🔍 저장할 데이터:', { finalEegResult, mocaScore, mmseScore });
      
      // 저장 시작 시 상태 업데이트하여 중복 실행 방지
      updateAssessmentSaved(true);
      
      // 결과 해시를 세션 스토리지에 저장
      sessionStorage.setItem('last_saved_result_hash', resultHash);
      
      // 비동기로 저장 실행
      autoSaveAssessment(finalEegResult, mocaScore, mmseScore).then((success) => {
        if (success) {
          console.log('✅ 자동 저장 완료!');
        } else {
          console.log('❌ 자동 저장 실패! 다시 시도 가능하도록 상태 초기화');
          updateAssessmentSaved(false);
          // 실패 시 해시도 제거
          sessionStorage.removeItem('last_saved_result_hash');
        }
      });
    } else if (!finalEegResult) {
      console.log('❌ finalEegResult가 없습니다!');
    } else if (assessmentSaved) {
      console.log('❌ 이미 저장되었습니다!');
    }
  }, [finalEegResult, assessmentSaved, mocaScore, mmseScore, updateAssessmentSaved]); // updateAssessmentSaved 의존성 추가

  // 페이지를 떠날 때 세션 스토리지 정리
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 페이지를 떠날 때 저장 상태는 유지하되, 임시 데이터는 정리
      // assessment_saved는 유지 (중복 저장 방지용)
      // last_saved_result_hash는 유지 (중복 저장 방지용)
    };

    const handlePageHide = () => {
      // 페이지가 숨겨질 때 (뒤로가기 등) 특별한 처리는 하지 않음
      // 저장 상태는 유지
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    
    try {
      const assessmentData: AssessmentData = {
        patientName: results.patientName,
        assessmentDate: results.assessmentDate,
        overallRisk: diagnosisInfo.title,
        mocaScore: results.cognitiveTest.mocaScore,
        mmseScore: results.cognitiveTest.mmseScore,
        confidenceLevel: results.confidenceLevel,
        recommendations: [diagnosisInfo.recommendation],
        cognitiveTestScore: undefined,
        personalizedGuide: personalizedGuide ? {
          title: personalizedGuide.title,
          color: personalizedGuide.color,
          guides: {
            food: {
              title: personalizedGuide.guides.food.title,
              items: personalizedGuide.guides.food.items
            },
            exercise: {
              title: personalizedGuide.guides.exercise.title,
              items: personalizedGuide.guides.exercise.items
            },
            behavior: {
              title: personalizedGuide.guides.behavior.title,
              items: personalizedGuide.guides.behavior.items
            }
          }
        } : undefined
      };
      
      await PDFService.generateAssessmentReport(assessmentData);
    } catch (error) {
      console.error("PDF 생성 오류:", error);
      alert("PDF 보고서 생성 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // 툴팁 위치 조정 함수
  const getTooltipPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // 요소가 화면 중앙 아래에 있으면 위쪽에 툴팁 표시
    if (rect.top > viewportHeight / 2) {
      return 'top';
    } else {
      return 'bottom';
    }
  };

  // 공통 권장사항
  const COMMON_RECOMMENDATIONS = {
    normal: "현재 뇌 건강 상태가 양호합니다. 지속적인 관리를 통해 건강을 유지해 주세요.",
    dementia: "전문적인 진단과 상담이 시급히 필요합니다. 정확한 진단과 치료를 받기 위해 즉시 의료기관을 방문해 주세요.",
    mci: "주의가 필요합니다. 전문의와 상담하고 추가적인 정밀 검사를 받으시길 권합니다."
  };

  // 기본 진단 정보를 반환하는 함수
  const getDefaultDiagnosisInfo = (diagnosis: DiagnosisResult) => {
    switch (diagnosis) {
      case "normal":
        return {
          title: "정상",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          badgeVariant: "default" as const,
          icon: CheckCircle,
          iconColor: "text-green-600",
          recommendation: COMMON_RECOMMENDATIONS.normal,
        };
      case "mci":
        return {
          title: "경도인지장애",
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          badgeVariant: "secondary" as const,
          icon: AlertTriangle,
          iconColor: "text-orange-600",
          recommendation: COMMON_RECOMMENDATIONS.mci,
        };
      case "dementia":
        return {
          title: "치매",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          badgeVariant: "destructive" as const,
          icon: AlertCircle,
          iconColor: "text-red-600",
          recommendation: COMMON_RECOMMENDATIONS.dementia,
        };
      default:
        return {
          title: "정상",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          badgeVariant: "default" as const,
          icon: CheckCircle,
          iconColor: "text-green-600",
          recommendation: COMMON_RECOMMENDATIONS.normal,
        };
    }
  };

  const getDiagnosisInfo = (diagnosis: DiagnosisResult, eegResult?: any) => {
    // 뇌파 검사 결과가 있으면 더 구체적인 진단 표시
    if (eegResult) {
      const getHighestProbLabel = (probMean: Record<string, number>) => {
        return Object.entries(probMean).reduce((a, b) => 
          Number(probMean[a[0]]) > Number(probMean[b[0]]) ? a : b
        )[0];
      };
      
      // 자동 분석 결과와 기존 결과 모두 처리
      const probabilities = eegResult.probabilities || eegResult.prob_mean;
      if (!probabilities) {
        // 확률 정보가 없으면 기본 진단 사용
        return getDefaultDiagnosisInfo(diagnosis);
      }
      
      const highestProbLabel = getHighestProbLabel(probabilities);
      
      switch (highestProbLabel) {
        case 'CN':
          return {
            title: "정상",
            color: "text-green-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
            badgeVariant: "default" as const,
            icon: CheckCircle,
            iconColor: "text-green-600",
            recommendation: COMMON_RECOMMENDATIONS.normal,
          };
        case 'AD':
        case 'FTD':
          return {
            title: highestProbLabel === 'AD' ? "알츠하이머 치매" : "전두측두엽 치매",
            color: "text-red-600",
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
            badgeVariant: "destructive" as const,
            icon: AlertCircle,
            iconColor: "text-red-600",
            recommendation: COMMON_RECOMMENDATIONS.dementia,
          };
        default:
          return {
            title: "정상",
            color: "text-green-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
            badgeVariant: "default" as const,
            icon: CheckCircle,
            iconColor: "text-green-600",
            recommendation: COMMON_RECOMMENDATIONS.normal,
          };
      }
    }
    
    // 뇌파 검사 결과가 없으면 기본 진단 사용
    return getDefaultDiagnosisInfo(diagnosis);
  };

  const diagnosisInfo = useMemo(() => getDiagnosisInfo(results.diagnosis, eegResult), [results.diagnosis, eegResult]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9]">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                홈으로 돌아가기
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
                <Brain className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">NeuroScan</span>
              </Link>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {new Date(results.assessmentDate).toLocaleDateString()}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Guest mode notification */}
        {!isLoggedIn && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
                              게스트 모드로 테스트를 진행했습니다. 결과는 PDF로 다운로드할 수 있지만,
                검사 기록은 저장되지 않습니다. 기록을 저장하려면 
              <Link to="/" className="underline ml-1 font-medium">
                로그인 후 다시 테스트
              </Link>해주세요.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Auto-save notification */}
        {assessmentSaved && isLoggedIn && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
                               검사 결과가 저장되었습니다. 
              <Link to="/assessment-history" className="underline ml-1 font-medium">
                검사 기록에서 확인하기
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Diagnosis Results */}
        <div className="mb-8">
          <Card className={`${diagnosisInfo.bgColor} ${diagnosisInfo.borderColor} border-2 mb-6`}>
            <CardHeader className="text-center">
              <div className={`w-20 h-20 ${diagnosisInfo.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <diagnosisInfo.icon className={`h-10 w-10 ${diagnosisInfo.iconColor}`} />
              </div>
              <CardTitle className={`text-3xl ${diagnosisInfo.color}`}>
                {diagnosisInfo.title}
              </CardTitle>
              <CardDescription className="text-lg">
                신뢰도: {results.confidenceLevel}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className={`${diagnosisInfo.bgColor} ${diagnosisInfo.borderColor}`}>
                <AlertCircle className={`h-4 w-4 ${diagnosisInfo.iconColor}`} />
                <AlertDescription className="text-foreground font-medium">
                  {diagnosisInfo.recommendation}
                </AlertDescription>
              </Alert>

            </CardContent>
          </Card>
        </div>



        {/* Detailed Results Explanation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>상세 분석</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cognitive" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="cognitive">인지평가 결과</TabsTrigger>
              </TabsList>
              
              <TabsContent value="eeg" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">뇌파 분석 결과</h3>

                    {/* 자동 분석 결과 표시 */}
                    {autoEegResult && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Bot className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-800">자동 뇌파 분석 결과</h4>
                        </div>
                        
                        {autoEegResult.status === 'success' ? (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">진단 결과</span>
                              <Badge variant={
                                autoEegResult.predicted_label === 'CN' ? 'default' : 
                                autoEegResult.predicted_label === 'AD' || autoEegResult.predicted_label === 'FTD' ? 'destructive' : 'secondary'
                              }>
                                {autoEegResult.predicted_label === 'CN' ? '정상' : 
                                 autoEegResult.predicted_label === 'AD' ? '알츠하이머' : 
                                 autoEegResult.predicted_label === 'FTD' ? '전두엽치매' : '분석중'}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="font-medium">신뢰도</span>
                              <span className="text-lg font-bold text-blue-600">
                                {Math.round(autoEegResult.confidence * 100)}%
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              <p>분석 시간: {autoEegResult.analysis_time}</p>
                              <p>파일: {autoEegResult.file_path}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-red-600">
                            <p className="font-medium">분석 실패</p>
                            <p className="text-sm">{autoEegResult.error}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">알파파 (8-12 Hz)</span>
                          <Badge variant="default">{results.eegAnalysis.alphaWaves.value}%</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          편안한 각성 상태를 나타내는 양호한 알파파 활동
                        </p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">베타파 (12-30 Hz)</span>
                          <Badge variant="default">{results.eegAnalysis.betaWaves.value}%</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          능동적인 인지 처리를 보여주는 건강한 베타파
                        </p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">세타파 (4-8 Hz)</span>
                          <Badge variant="secondary">{results.eegAnalysis.thetaWaves.value}%</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          정상 범위 내에서 약간 증가된 세타파 활동
                        </p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">델타파 (0.5-4 Hz)</span>
                          <Badge variant="default">{results.eegAnalysis.deltaWaves.value}%</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          건강한 수면-각성 주기를 나타내는 정상 델타파 패턴
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">주요 지표</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span>정상</span>
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span>주의</span>
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span>위험</span>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">전체 뇌파 점수</span>
                          <span className="text-2xl font-bold text-primary">{results.eegAnalysis.overallScore}/100</span>
                        </div>
                        <Progress value={results.eegAnalysis.overallScore} className="mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {results.eegAnalysis.overallScore >= 80 ? '건강한' : '우려되는'} 뇌 파동 패턴을 나타냅니다
                        </p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">반구 간 비대칭성</span>
                          <Badge variant={results.eegAnalysis.asymmetryIndex < 0.2 ? "default" : "secondary"}>
                            {results.eegAnalysis.asymmetryIndex}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {results.eegAnalysis.asymmetryIndex < 0.2 ? '뇌 반구 간 정상적인 균형' : '반구 간 일부 불균형이 감지됨'}
                        </p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">전체 일관성</span>
                          <Badge variant={results.eegAnalysis.overallCoherence > 0.7 ? "default" : "secondary"}>
                            {results.eegAnalysis.overallCoherence}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {results.eegAnalysis.overallCoherence > 0.7 ? '뇌 영역 간 양호한 연결성' : '일부 연결성 문제가 감지됨'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="cognitive" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">종합 인지 평가</h3>

                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                      <h4 className="font-semibold text-foreground mb-2">종합 인지 평가 총점</h4>
                      {results.cognitiveTest.mocaScore && results.cognitiveTest.mocaScore > 0 ? (
                        <>
                          <div className="text-3xl font-bold text-primary mb-2">{results.cognitiveTest.mocaScore}/30</div>
                          <p className="text-sm text-muted-foreground">
                            {results.cognitiveTest.mocaScore >= 21 ? '21점 이상으로 정상 범위입니다' : '20점 이하로 경도인지장애입니다'}
                          </p>
                        </>
                      ) : (
                        <div className="text-3xl font-bold text-muted-foreground mb-2">검사 미완료</div>
                      )}
                    </div>

                    {/* MOCA-K 결과 바 추가 */}
                    <div className="space-y-3">
                      <div className="w-full bg-gray-200 rounded-full h-3 relative mb-8">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            results.cognitiveTest.mocaScore && results.cognitiveTest.mocaScore >= 21 ? 'bg-green-500' : 
                            results.cognitiveTest.mocaScore && results.cognitiveTest.mocaScore >= 18 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: results.cognitiveTest.mocaScore && results.cognitiveTest.mocaScore > 0 ? `${(results.cognitiveTest.mocaScore / 30) * 100}%` : '0%' 
                          }}
                        ></div>
                        {/* 바 밑에 숫자 표시 */}
                        <div className="absolute -bottom-6 left-0 text-xs text-gray-600">0</div>
                        <div className="absolute -bottom-6 left-[70%] transform -translate-x-1/2 text-xs text-gray-600">21</div>
                        <div className="absolute -bottom-6 right-0 text-xs text-gray-600">30</div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">판정 기준</h4>
                      <div className="space-y-2 text-sm text-blue-700">
                        <div className="flex justify-between">
                          <span className="font-semibold group relative cursor-help">
                            21점 이상:
                            {/* 툴팁 */}
                            <div className="absolute bottom-full left-0 mb-3 px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-lg border border-blue-200 w-52 z-50 leading-relaxed backdrop-blur-sm">
                              <div className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full mt-1 flex-shrink-0"></div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-blue-800 mb-1 text-sm">정상 뇌 건강</div>
                                  <div className="text-gray-700 text-xs leading-relaxed">
                                    중대한 인지 저하나 신경학적 이상이 없음.<br />
                                    균형잡힌 뇌파 패턴과 양호한 인지 능력을 보입니다.
                                  </div>
                                </div>
                              </div>
                              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-100"></div>
                            </div>
                          </span>
                          <span className="font-semibold">정상</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold group relative cursor-help">
                            20점 이하:
                            {/* 툴팁 */}
                            <div className="absolute bottom-full left-0 mb-3 px-4 py-3 bg-gradient-to-br from-orange-50 to-amber-100 text-gray-800 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-lg border border-orange-200 w-52 z-50 leading-relaxed backdrop-blur-sm">
                              <div className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-orange-400 rounded-full mt-1 flex-shrink-0"></div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-orange-800 mb-1 text-sm">경도인지장애</div>
                                  <div className="text-gray-700 text-xs leading-relaxed">
                                    정상 노화보다 큰 인지 변화.<br />
                                    기억력, 작업, 언어에 경미한 문제.
                                  </div>
                                </div>
                              </div>
                              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-100"></div>
                            </div>
                          </span>
                          <span className="font-semibold">경도인지장애</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">간이 인지 검사</h3>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">간이 인지 검사 총점</h4>
                      {results.cognitiveTest.mmseScore && results.cognitiveTest.mmseScore > 0 ? (
                        <>
                          <div className="text-3xl font-bold text-green-600 mb-2">{results.cognitiveTest.mmseScore}/30</div>
                          <p className="text-sm text-green-700">
                            {results.cognitiveTest.mmseScore >= 24 ? '24점 이상으로 정상입니다' : 
                             results.cognitiveTest.mmseScore >= 18 ? '23~18점으로 경도인지장애입니다' : 
                             '17점 이하로 인지기능장애입니다'}
                          </p>
                        </>
                      ) : (
                        <div className="text-3xl font-bold text-muted-foreground mb-2">검사 미완료</div>
                      )}
                    </div>

                    {/* MMSE-K 결과 바 추가 */}
                    <div className="space-y-3">
                      <div className="w-full bg-gray-200 rounded-full h-3 relative mb-8">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            results.cognitiveTest.mmseScore && results.cognitiveTest.mmseScore >= 24 ? 'bg-green-500' : 
                            results.cognitiveTest.mmseScore && results.cognitiveTest.mmseScore >= 18 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: results.cognitiveTest.mmseScore && results.cognitiveTest.mmseScore > 0 ? `${(results.cognitiveTest.mmseScore / 30) * 100}%` : '0%' 
                          }}
                        ></div>
                        {/* 바 밑에 숫자 표시 */}
                        <div className="absolute -bottom-6 left-0 text-xs text-gray-600">0</div>
                        <div className="absolute -bottom-6 left-[60%] transform -translate-x-1/2 text-xs text-gray-600">18</div>
                        <div className="absolute -bottom-6 left-[80%] transform -translate-x-1/2 text-xs text-gray-600">24</div>
                        <div className="absolute -bottom-6 right-0 text-xs text-gray-600">30</div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">판정 기준</h4>
                      <div className="space-y-2 text-sm text-green-700">
                        <div className="flex justify-between">
                          <span className="font-semibold group relative cursor-help">
                            24~30점:
                            {/* 툴팁 */}
                            <div className="absolute bottom-full left-0 mb-3 px-4 py-3 bg-gradient-to-br from-green-50 to-emerald-100 text-gray-800 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-lg border border-green-200 w-52 z-50 leading-relaxed backdrop-blur-sm">
                              <div className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full mt-1 flex-shrink-0"></div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-green-800 mb-1 text-sm">정상</div>
                                  <div className="text-gray-700 text-xs leading-relaxed">
                                    정상 뇌 건강.<br />
                                    인지 저하나 신경학적 이상 없음.
                                  </div>
                                </div>
                              </div>
                              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-100"></div>
                            </div>
                          </span>
                          <span className="font-semibold">정상</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold group relative cursor-help">
                            23~18점:
                            {/* 툴팁 */}
                            <div className="absolute bottom-full left-0 mb-3 px-4 py-3 bg-gradient-to-br from-orange-50 to-amber-100 text-gray-800 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-lg border border-orange-200 w-52 z-50 leading-relaxed backdrop-blur-sm">
                              <div className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-orange-400 rounded-full mt-1 flex-shrink-0"></div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-orange-800 mb-1 text-sm">경도인지장애</div>
                                  <div className="text-gray-700 text-xs leading-relaxed">
                                    정상 노화보다 큰 인지 변화.<br />
                                    기억력, 작업, 언어에 경미한 문제.
                                  </div>
                                </div>
                              </div>
                              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-100"></div>
                            </div>
                          </span>
                          <span className="font-semibold">경도인지장애</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold group relative cursor-help">
                            0~17점:
                            {/* 툴팁 */}
                            <div className="absolute bottom-full left-0 mb-3 px-4 py-3 bg-gradient-to-br from-red-50 to-rose-100 text-gray-800 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-lg border border-red-200 w-52 z-50 leading-relaxed backdrop-blur-sm">
                              <div className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-red-400 rounded-full mt-1 flex-shrink-0"></div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-red-800 mb-1 text-sm">인지기능장애</div>
                                  <div className="text-gray-700 text-xs leading-relaxed">
                                    일상생활에 지장을 주는<br />
                                    심각한 인지 저하.<br />
                                    기억 상실과 의사소통 문제.
                                  </div>
                                </div>
                              </div>
                              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-100"></div>
                            </div>
                          </span>
                          <span className="font-semibold">인지기능장애</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


              </TabsContent>
              

            </Tabs>
          </CardContent>
        </Card>

        {/* Personalized Guidance Section */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-blue-50 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <span>맞춤형 생활 가이드</span>
            </CardTitle>
            <CardDescription>
              뇌파 검사 결과에 따른 맞춤형 생활 가이드를 제공합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {personalizedGuide ? (
              <div className="mb-6">
                <div className={`bg-gradient-to-br ${personalizedGuide.bgColor} rounded-xl p-6 border ${personalizedGuide.borderColor} shadow-lg`}>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className={`w-3 h-3 ${personalizedGuide.dotColor} rounded-full`}></div>
                    <h4 className={`font-bold text-lg ${personalizedGuide.textColor}`}>{personalizedGuide.title}</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 음식 가이드 */}
                    <div className="bg-white/70 rounded-lg p-4">
                      <h5 className={`font-semibold ${personalizedGuide.accentColor} mb-2 flex items-center`}>
                        <Utensils className="h-4 w-4 mr-2" />
                        {personalizedGuide.guides.food.title}
                      </h5>
                      <ul className={`text-sm ${personalizedGuide.textColor} space-y-1`}>
                        {personalizedGuide.guides.food.items.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* 운동 가이드 */}
                    <div className="bg-white/70 rounded-lg p-4">
                      <h5 className={`font-semibold ${personalizedGuide.accentColor} mb-2 flex items-center`}>
                        <Activity className="h-4 w-4 mr-2" />
                        {personalizedGuide.guides.exercise.title}
                      </h5>
                      <ul className={`text-sm ${personalizedGuide.textColor} space-y-1`}>
                        {personalizedGuide.guides.exercise.items.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* 행동강령 */}
                    <div className="bg-white/70 rounded-lg p-4">
                      <h5 className={`font-semibold ${personalizedGuide.accentColor} mb-2 flex items-center`}>
                        <Target className="h-4 w-4 mr-2" />
                        {personalizedGuide.guides.behavior.title}
                      </h5>
                      <ul className={`text-sm ${personalizedGuide.textColor} space-y-1`}>
                        {personalizedGuide.guides.behavior.items.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-600">
                  뇌파 검사 결과가 없습니다. 맞춤형 가이드를 받으려면 뇌파 검사를 먼저 진행해 주세요.
                </p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-amber-800 mb-1">중요 안내사항</h4>
                  <p className="text-xs text-amber-700">
                    이 검사 결과는 참고용이며, 정확한 진단과 치료를 위해서는 반드시 전문의료진의 상담을 받으시기 바랍니다. 
                    특히 인지기능 저하가 의심되는 경우 즉시 의료기관을 방문하시는 것이 중요합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 맞춤형 가이드 받기 버튼 - 비활성화됨
            <div className="text-center">
              <Button
                onClick={() => setIsChatbotOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                맞춤형 가이드 받기
              </Button>
            </div>
            */}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>추가 작업</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="w-full h-12"
              >
                {downloadingPDF ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    생성 중...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    PDF 다운로드
                  </>
                )}
              </Button>

              <Button variant="outline" className="w-full h-12" asChild>
                <Link to="/assessment">
                  <Activity className="h-4 w-4 mr-2" />
                  다시 검사하기
                </Link>
              </Button>

              <Button 
                variant="outline" 
                className="w-full h-12"
                onClick={() => {
                  if (isLoggedIn) {
                    navigate('/assessment-history');
                  } else {
                    // 비로그인 사용자에게 로그인 필요 안내
                    alert('검사 기록을 보려면 로그인이 필요합니다.\n로그인 후 이용해주세요.');
                  }
                }}
              >
                <History className="h-4 w-4 mr-2" />
                검사 기록 보기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Chatbot Icon - 비활성화됨
      <div className="fixed bottom-6 right-6 z-40 group">
        <Button
          onClick={() => setIsChatbotOpen(true)}
                          className="w-14 h-14 rounded-full shadow-md hover:shadow-lg transition-colors duration-200 bg-primary hover:bg-primary/90"
          size="sm"
          title="챗봇에게 물어보기"
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </Button>
      </div>
      */}

      {/* Chatbot Component - 비활성화됨
      <Chatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        userDiagnosis={diagnosisInfo.title}
      />
      */}
    </div>
  );
}
