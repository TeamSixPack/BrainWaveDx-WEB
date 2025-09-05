import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Brain, Upload, FileText, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL } from "@/lib/api";

type TestStep = "upload" | "processing" | "result" | "additional-test";

interface EegResult {
  subject_id: string;
  segment_majority_label: string;    // 실제 Flask 응답 키
  segment_majority_index: number;    // 실제 Flask 응답 키
  segment_accuracy: number;          // 실제 Flask 응답 키
  n_segments: number;
  segment_counts: Record<string, number>;
  prob_mean: Record<string, number>;
  channels_used: string[];           // 추가 정보
  window?: { start: number; need: number }; // 추가 정보
  class_mode?: number;               // 2클래스 또는 3클래스 모드
}

export default function EegTest() {
  const [currentStep, setCurrentStep] = useState<TestStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eegResult, setEegResult] = useState<EegResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.set') || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError("올바른 .set 또는 .csv 파일을 선택해주세요.");
        setSelectedFile(null);
      }
    }
  };

  const analyzeEegFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('true_label', 'CN'); // 기본값, 실제로는 사용자가 입력할 수 있게 할 수 있음
      formData.append('subject_id', 'test-subject');
      formData.append('enforce_two_minutes', 'true');

      // Spring Boot 서버로 파일 전송
      const response = await fetch(`${API_BASE_URL}/api/upload-eeg`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('뇌파 분석 요청에 실패했습니다.');
      }

      const result = await response.json();
      
      // 디버깅: 실제 API 응답 확인
      console.log('🔍 API 응답 전체:', result);
      console.log('🔍 API 상태:', result.status);
      console.log('🔍 API 결과:', result.result);
      
      if (result.status === 'ok' && result.result) {
        console.log('✅ 실제 뇌파 분석 결과 설정:', result.result);
        setEegResult(result.result);
        setCurrentStep("result");
      } else {
        console.error('❌ API 오류:', result.error);
        throw new Error(result.error || '분석 결과를 받아오는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '뇌파 분석 중 오류가 발생했습니다.');
      console.error('EEG 분석 오류:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getDiagnosisLabel = (label: string) => {
    switch (label) {
      case 'CN': return '정상';
      case 'AD': return '알츠하이머';
      case 'FTD': return '전두측두엽 치매';
      default: return label;
    }
  };

  const getDiagnosisColor = (label: string) => {
    switch (label) {
      case 'CN': return 'bg-green-500 text-green-900 border-green-300';
      case 'AD': return 'bg-red-500 text-white border-red-300';
      case 'FTD': return 'bg-orange-500 text-white border-orange-300';
      default: return 'bg-blue-500 text-white border-blue-300';
    }
  };

  // 2클래스 모드인지 확인
  const is2ClassMode = () => {
    return eegResult?.class_mode === 2;
  };

  const getHighestProbLabel = (probMean: Record<string, number>) => {
    return Object.entries(probMean).reduce((a, b) => 
      Number(probMean[a[0]]) > Number(probMean[b[0]]) ? a : b
    )[0];
  };

  const handleContinueToAdditionalTest = () => {
    setCurrentStep("additional-test");
  };

  const handleSkipAdditionalTest = () => {
    // Results 페이지로 이동
    navigate('/results', { 
      state: { 
        eegResult,
        additionalTests: false 
      } 
    });
  };

  const handleStartAdditionalTest = () => {
    // 인지검사 페이지로 이동
    navigate('/cognitive-test', { 
      state: { 
        eegResult,
        fromEegTest: true 
      } 
    });
  };

  const handleGoToResults = () => {
    // 바로 Results 페이지로 이동
    navigate('/results', { 
      state: { 
        eegResult,
        additionalTests: false 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9]">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 lg:space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">뒤로</span>
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
              <span className="text-lg lg:text-xl font-bold text-foreground">뇌파 분석 테스트</span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs lg:text-sm">
            {currentStep === 'upload' ? '파일 업로드' : 
             currentStep === 'processing' ? '분석 중' : 
             currentStep === 'result' ? '결과' : '추가 검사'}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 lg:py-8 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">테스트 진행률</span>
            <span className="text-sm text-muted-foreground">
              {currentStep === 'upload' ? 25 : 
               currentStep === 'processing' ? 50 : 
               currentStep === 'result' ? 75 : 100}% 완료
            </span>
          </div>
          <Progress 
            value={currentStep === 'upload' ? 25 : 
                   currentStep === 'processing' ? 50 : 
                   currentStep === 'result' ? 75 : 100} 
            className="h-2" 
          />
        </div>

        {/* Upload Step */}
        {currentStep === 'upload' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">뇌파 파일 업로드</CardTitle>
              <CardDescription className="text-lg">
                분석할 .set 또는 .csv 파일을 선택해주세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept=".set,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                                         <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                                         <p className="text-lg font-medium text-blue-700 mb-2">
                      파일을 선택하거나 여기로 드래그하세요
                    </p>
                                         <p className="text-sm text-blue-500">
                       .set 또는 .csv 파일을 지원합니다
                     </p>
                  </label>
                </div>

                {selectedFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-700">
                        선택된 파일: {selectedFile.name}
                      </span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      파일 크기: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-700">{error}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center">
                <Button 
                  onClick={analyzeEegFile}
                  size="lg" 
                  className="px-8"
                  disabled={!selectedFile || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      뇌파 분석 시작
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Step */}
        {currentStep === 'processing' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl">뇌파 데이터 분석 중</CardTitle>
              <CardDescription className="text-lg">
                AI가 뇌파 패턴을 분석하고 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">파일 업로드</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">신호 전처리</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI 패턴 분석</span>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-opacity-50">결과 생성</span>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>

                             <div className="bg-white border border-gray-200 rounded-lg p-4">
                 <p className="text-sm text-muted-foreground">
                   분석은 일반적으로 1-2분이 소요됩니다. 이 창을 닫지 마세요.
                 </p>
               </div>
            </CardContent>
          </Card>
        )}

        {/* Result Step */}
        {currentStep === 'result' && eegResult && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">뇌파 분석 완료</CardTitle>
              <CardDescription className="text-lg">
                AI 분석 결과입니다 {is2ClassMode() && <Badge variant="secondary" className="ml-2">2클래스 모드</Badge>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                             {/* 진단 결과 */}
               <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">진단 결과</h3>
                <div className="flex items-center space-x-4">
                  <Badge 
                    className={`${getDiagnosisColor(getHighestProbLabel(eegResult.prob_mean))} px-4 py-2 text-lg`}
                  >
                    {getDiagnosisLabel(getHighestProbLabel(eegResult.prob_mean))}
                  </Badge>
                                     <span className="text-sm text-muted-foreground">
                     신뢰도: {(Math.max(...Object.values(eegResult.prob_mean).map(v => Number(v))) * 100).toFixed(1)}%
                   </span>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  <div>세그먼트 다수결: {getDiagnosisLabel(eegResult.segment_majority_label)} ({(eegResult.segment_accuracy * 100).toFixed(1)}%)</div>
                  <div>확률 최고값: {getDiagnosisLabel(getHighestProbLabel(eegResult.prob_mean))} ({(Math.max(...Object.values(eegResult.prob_mean).map(v => Number(v))) * 100).toFixed(1)}%)</div>
                </div>
              </div>

              {/* 세그먼트 분포 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="bg-white border border-gray-200 rounded-lg p-6">
                   <h3 className="text-lg font-semibold mb-4">세그먼트 분포</h3>
                  <div className="space-y-2">
                    {Object.entries(eegResult.segment_counts).map(([label, count]) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {getDiagnosisLabel(label)}:
                        </span>
                        <span className="font-medium">{count}개</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center font-semibold">
                        <span>총 세그먼트:</span>
                        <span>{eegResult.n_segments}개</span>
                      </div>
                    </div>
                  </div>
                </div>

                                 {/* 확률 분포 */}
                 <div className="bg-white border border-gray-200 rounded-lg p-6">
                   <h3 className="text-lg font-semibold mb-4">확률 분포</h3>
                  <div className="space-y-3">
                    {Object.entries(eegResult.prob_mean).map(([label, prob]) => (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {getDiagnosisLabel(label)}:
                          </span>
                          <span className="font-medium">
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                                                 <div className="w-full bg-blue-50 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getDiagnosisColor(label)}`}
                            style={{ width: `${prob * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 맞춤형 가이드 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">맞춤형 가이드</h3>
                <div className="space-y-4">
                  {getHighestProbLabel(eegResult.prob_mean) === 'CN' ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">정상 뇌파 패턴</span>
                      </div>
                      <div className="text-sm text-green-700 space-y-2">
                        <p>• 현재 뇌파 상태는 정상 범위 내에 있습니다</p>
                        <p>• 정기적인 뇌 건강 체크를 권장합니다 (6개월~1년)</p>
                        <p>• 균형잡힌 식단과 규칙적인 운동을 유지하세요</p>
                        <p>• 충분한 수면과 스트레스 관리를 해주세요</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <span className="font-semibold text-amber-800">주의가 필요한 뇌파 패턴</span>
                      </div>
                      <div className="text-sm text-amber-700 space-y-2">
                        <p>• 전문의와 상담을 권장합니다</p>
                        <p>• 추가적인 인지 기능 검사가 필요할 수 있습니다</p>
                        <p>• 정기적인 의료진과의 상담을 유지하세요</p>
                        <p>• 생활 습관 개선과 함께 의학적 관리가 중요합니다</p>
                      </div>
                    </div>
                  )}
                  
                  {/* 공통 권장사항 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">일반적인 뇌 건강 관리</span>
                    </div>
                    <div className="text-sm text-blue-700 space-y-2">
                      <p>• 오메가-3, 비타민 B군이 풍부한 식단</p>
                      <p>• 규칙적인 유산소 운동 (주 3-4회, 30분 이상)</p>
                      <p>• 충분한 수면 (7-8시간)</p>
                      <p>• 스트레스 관리 및 명상</p>
                      <p>• 사회적 활동과 새로운 학습</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 추가 정보 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">분석 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">사용된 채널:</span>
                    <div className="mt-1 text-gray-600">
                      {eegResult.channels_used ? eegResult.channels_used.join(', ') : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">대상자 ID:</span>
                    <div className="mt-1 text-gray-600">{eegResult.subject_id || 'N/A'}</div>
                  </div>
                  {eegResult.window && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">분석 창:</span>
                      <div className="mt-1 text-gray-600">
                        시작: {eegResult.window.start}초, 필요: {eegResult.window.need}초
                      </div>
                    </div>
                  )}
                </div>
              </div>

                             <div className="text-center space-y-4">
                 <Button onClick={handleContinueToAdditionalTest} size="lg" className="px-8">
                   추가 검사 진행하기
                 </Button>
                 <Button variant="secondary" onClick={handleGoToResults} size="lg" className="px-8">
                   결과 페이지로 이동
                 </Button>
               </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Test Step */}
        {currentStep === 'additional-test' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">추가 검사 안내</CardTitle>
              <CardDescription className="text-lg">
                더 정확한 진단을 위한 인지 기능 검사를 진행하시겠습니까?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">추가 검사 포함:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• MMSE (간이정신상태검사)</li>
                  <li>• MOCA (몬트리올 인지평가)</li>
                  <li>• 기타 인지 기능 테스트</li>
                </ul>
              </div>

              <div className="text-center space-y-4">
                <Button onClick={handleStartAdditionalTest} size="lg" className="px-8">
                  인지 기능 검사 시작
                </Button>
                <Button variant="outline" onClick={handleSkipAdditionalTest} size="lg" className="px-8">
                  뇌파 분석 결과만 확인
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
