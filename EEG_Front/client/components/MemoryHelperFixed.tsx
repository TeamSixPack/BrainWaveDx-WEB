import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Send, Loader2, Brain, AlertTriangle, CheckCircle, ArrowRight, Bot, Download, RotateCcw, Home } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";

const MemoryHelperFixed: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState<'question' | 'listening' | 'processing' | 'result'>('question');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponse, setUserResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [isResultReady, setIsResultReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [micActive, setMicActive] = useState(false);
  const [hasRequestedMic, setHasRequestedMic] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // FastAPI 음성 챗봇 API 호출
  const callFastAPIAnalysis = async (questionText: string, answerText: string) => {
    try {
      const response = await fetch('http://localhost:8001/voice-chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_response: answerText,
          question_context: questionText,
          session_id: `memory-helper-${Date.now()}`,
          user_id: user?.uid || 'anonymous'
        }),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('FastAPI 분석 요청 실패:', error);
      // 실패 시 기존 함수 사용
      return buildAnalysisFromAnswer(answerText);
    }
  };

  // 사용자 발화 기반 간단 요약/분석 생성기 (백업용)
  const buildAnalysisFromAnswer = (answerRaw: string) => {
    const answer = (answerRaw || '').trim();
    // 요약: 첫 문장 또는 80~120자 범위로 축약
    let summary = '';
    const sentSplit = answer.split(/[\.!?\n]/).map(s => s.trim()).filter(Boolean);
    if (sentSplit.length > 0) {
      summary = sentSplit[0];
    } else {
      summary = answer.slice(0, 120);
    }
    if (summary.length < answer.length && summary.length < 80) {
      const extra = answer.slice(summary.length).trim();
      if (extra) summary = (summary + ' ' + extra).slice(0, 120);
    }

    // 키워드 기반 간단 분석
    const lower = answer.toLowerCase();
    const ko = answer;
    const freqSignals = /(자주|자꾸|반복|최근|요즘|종종|가끔)/.test(ko);
    const memorySignals = /(깜빡|잊|기억|헷갈|불편|곤란|생각이 안)/.test(ko);
    const timePlaceSignals = /(언제|어디|시간|장소|이유|목적)/.test(ko);

    let analysis = '';
    if (memorySignals && freqSignals) {
      analysis = '최근 반복되는 건망증 신호가 관찰됩니다';
    } else if (memorySignals) {
      analysis = '일시적 건망증 가능성이 있습니다';
    } else if (timePlaceSignals) {
      analysis = '상황 설명 위주로 발화가 이루어졌습니다';
    } else if (answer.length > 0) {
      analysis = '일상 경험 공유 중심의 발화로 보입니다';
    } else {
      analysis = '유의미한 발화가 인식되지 않았습니다';
    }

    const guidance = freqSignals
      ? '경험이 반복되면 가까운 병원/보건소에서 상담을 받아보시는 것을 권장합니다.'
      : '충분한 수면, 규칙적인 생활, 메모 습관 등이 도움이 됩니다.';

    return { summary, analysis, guidance };
  };

  // FastAPI 결과를 기존 형식으로 변환
  const formatFastAPIResult = (fastAPIResult: any, questionText: string, answerText: string) => {
    if (fastAPIResult.status === 'success' && fastAPIResult.analysis) {
      const { summary, psychological_state, cautions } = fastAPIResult.analysis;
      
      // 요약
      let summaryText = '';
      if (summary && !summary.error) {
        if (summary.main_points && Array.isArray(summary.main_points)) {
          summaryText = summary.main_points.join(', ');
        } else {
          summaryText = answerText;
        }
      } else {
        summaryText = answerText;
      }

      // 분석
      let analysisText = '';
      if (psychological_state && !psychological_state.error) {
        if (psychological_state.key_concerns && Array.isArray(psychological_state.key_concerns)) {
          analysisText = `주요 우려사항: ${psychological_state.key_concerns.join(', ')}`;
        } else if (psychological_state.emotional_state) {
          analysisText = `감정 상태: ${psychological_state.emotional_state}`;
        } else {
          analysisText = '심리상태 분석이 완료되었습니다.';
        }
      } else {
        analysisText = '최근 반복되는 건망증 신호가 관찰됩니다';
      }

      // 안내
      let guidanceText = '';
      if (cautions && !cautions.error) {
        if (cautions.immediate_actions && Array.isArray(cautions.immediate_actions)) {
          guidanceText = `즉시 조치: ${cautions.immediate_actions.join(', ')}`;
        } else if (cautions.when_to_seek_help) {
          guidanceText = `전문가 상담: ${cautions.when_to_seek_help}`;
        } else {
          guidanceText = '경험이 반복되면 가까운 병원/보건소에서 상담을 받아보시는 것을 권장합니다.';
        }
      } else {
        guidanceText = '경험이 반복되면 가까운 병원/보건소에서 상담을 받아보시는 것을 권장합니다.';
      }

      return { summary: summaryText, analysis: analysisText, guidance: guidanceText };
    } else {
      // FastAPI 실패 시 기존 함수 사용
      return buildAnalysisFromAnswer(answerText);
    }
  };

  // 경험 유도형 질문 리스트
  const experienceQuestions = [
    {
      id: 'q1',
      keyword: '자주 쓰던 물건 이름이 갑자기\n 생각 나지 않은 적 있나요?',
      question: '자주 쓰던 물건 이름이 갑자기 생각 나지 않은 적 있나요?'
    },
    {
      id: 'q2',
      keyword: '대화 중에 단어가 떠오르지 않아서\n 곤란했던 적이 있나요?',
      question: '대화 중에 단어가 떠오르지 않아서 곤란했던 적이 있나요?'
    },
    {
      id: 'q3',
      keyword: '가족이나 지인이 평소와 다르다고 \n 말한 적이 있나요?',
      question: '가족이나 지인이 평소와 다르다고 말한 적이 있나요?'
    },
    {
      id: 'q4',
      keyword: '최근에 불편했던 점이나 걱정되는 점이 있나요?\n (자유롭게 말씀해 주세요)',
      question: '최근에 불편했던 점이나 걱정되는 점이 있나요?'
    }
  ];

  // 음성 합성 (TTS)
  const speakMessage = (message: string, onComplete?: () => void) => {
    if ('speechSynthesis' in window) {
      try {
        // 기존 음성 중지
        speechSynthesis.cancel();
        
        // 음성 합성 API가 준비될 때까지 대기
        if (speechSynthesis.getVoices().length === 0) {
          speechSynthesis.addEventListener('voiceschanged', () => {
            speakMessage(message, onComplete);
          });
          return;
        }
        
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 0.9;
        
        // 한국어 음성 우선 선택
        const voices = speechSynthesis.getVoices();
        const koreanVoice = voices.find(voice => 
          voice.lang.includes('ko') || voice.lang.includes('KR')
        );
        if (koreanVoice) {
          utterance.voice = koreanVoice;
        }
        
        utterance.onstart = () => {
          console.log('음성 시작:', message);
        };
        
        utterance.onend = () => {
          console.log('음성 완료:', message);
          if (onComplete) onComplete();
        };
        
        utterance.onerror = (event) => {
          console.error('음성 오류:', event);
          if (onComplete) onComplete();
        };
        
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('음성 합성 실패:', error);
        if (onComplete) onComplete();
      }
    } else {
      console.log('음성 합성 API를 지원하지 않습니다');
      if (onComplete) onComplete();
    }
  };

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 마이크 권한 요청
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      setHasRequestedMic(true);
      return true;
    } catch (error) {
      console.error('마이크 권한 요청 실패:', error);
      setMicPermission('denied');
      setHasRequestedMic(true);
      return false;
    }
  };

  // 음성 녹음 시작
  const startListening = async () => {
    if (micPermission === 'unknown' && !hasRequestedMic) {
      const granted = await requestMicPermission();
      if (!granted) {
        setError('마이크 접근 권한이 필요합니다.');
        return;
      }
    }

    if (micPermission === 'denied') {
      setError('마이크 접근 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processAudio();
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
      setMicActive(true);
      setError(null);
      setCurrentStep('listening');
      
    } catch (err) {
      console.error("음성 녹음 시작 실패:", err);
      setError('마이크 접근 권한이 필요합니다.');
    }
  };

  // 음성 녹음 중지
  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setMicActive(false);
    }
  };

  // 오디오 처리 (시뮬레이션)
  const processAudio = async () => {
    // 실제 구현에서는 음성 인식 API 사용
    const simulatedResponse = "네, 최근에 자주 그런 일이 있어요. 물건을 어디에 두었는지 기억이 안 나서 찾는데 시간이 오래 걸려요.";
    setUserResponse(simulatedResponse);
    await analyzeResponse(simulatedResponse);
  };

  // 응답 분석
  const analyzeResponse = async (userResponse: string) => {
    if (!userResponse.trim()) {
      setError("답변을 입력해주세요.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setCurrentStep('processing');

    try {
      const dateStr = formatDate(new Date());
      const lastQuestionId = experienceQuestions[currentQuestionIndex];
      const questionText = lastQuestion.question;
      const answerText = userResponse;

      // FastAPI 분석 호출
      const fastAPIResult = await callFastAPIAnalysis(questionText, answerText);
      const ai = formatFastAPIResult(fastAPIResult, questionText, answerText);
      
      const report = `📝 인지건강 상담 기록 (${dateStr})\n\n[사용자 발화 기록]\n\n- 질문: ${questionText}\n- 답변: ${answerText}\n\n[AI 요약]\n\n- 요약: ${ai.summary}\n- 분석: ${ai.analysis}\n- 안내: ${ai.guidance}`;

      setAnalysisResult(report);
      setIsAnalyzing(false);
      setIsResultReady(true);
      setCurrentStep('result');

    } catch (err: any) {
      console.error("분석 중 오류 발생:", err);
      setError(err.message || "분석 중 오류가 발생했습니다.");
      setIsAnalyzing(false);
    }
  };

  // 텍스트 직접 입력 후 분석
  const handleTextSubmit = () => {
    if (userResponse.trim()) {
      analyzeResponse(userResponse);
    }
  };

  // 다음 질문으로 이동
  const nextQuestion = () => {
    if (currentQuestionIndex < experienceQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserResponse("");
      setAnalysisResult("");
      setIsResultReady(false);
      setCurrentStep('question');
      setError(null);
    }
  };

  // 처음부터 다시 시작
  const restart = () => {
    setCurrentQuestionIndex(0);
    setUserResponse("");
    setAnalysisResult("");
    setIsResultReady(false);
    setCurrentStep('question');
    setError(null);
  };

  // PDF 다운로드
  const handleDownloadPDF = () => {
    // PDF 다운로드 로직 구현
    console.log('PDF 다운로드');
  };

  // 다시 검사하기
  const handleRetest = () => {
    restart();
  };

  // 다시 인식하기
  const retryRecognition = () => {
    setUserResponse("");
    setError(null);
    setCurrentStep('question');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎤 AI 기억력 도우미 (FastAPI 연동)
          </h1>
          <p className="text-lg text-gray-600">
            음성으로 답변하고 AI가 분석해드립니다
          </p>
        </div>

        {/* 메인 컨텐츠 */}
        {currentStep === 'question' && (
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
                질문 {currentQuestionIndex + 1} / {experienceQuestions.length}
              </CardTitle>
              <CardDescription className="text-lg">
                {experienceQuestions[currentQuestionIndex].question}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 음성 녹음 버튼 */}
              <div className="text-center">
                <Button
                  onClick={startListening}
                  disabled={isAnalyzing}
                  size="lg"
                  className="w-32 h-32 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Mic className="w-12 h-12" />
                </Button>
                <p className="text-sm text-gray-600 mt-2">클릭하여 음성 녹음 시작</p>
              </div>

              {/* 또는 텍스트 입력 */}
              <div className="text-center">
                <p className="text-gray-600 mb-3">또는 직접 텍스트로 입력</p>
                <textarea
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  placeholder="질문에 대한 답변을 입력해주세요..."
                  className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  disabled={isAnalyzing}
                />
                <Button
                  onClick={handleTextSubmit}
                  disabled={!userResponse.trim() || isAnalyzing}
                  className="mt-3 px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  분석 시작
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 음성 듣기 단계 */}
        {currentStep === 'listening' && (
          <Card className="shadow-xl border-0 bg-white">
            <CardContent className="p-12 text-center">
              <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <Mic className="w-20 h-20 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                음성을 듣고 있습니다...
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                편안하게 답변해 주세요
              </p>
              <Button 
                onClick={stopListening}
                size="lg"
                variant="destructive"
                className="px-8 py-3 text-lg font-semibold"
              >
                <MicOff className="w-6 h-6 mr-2" />
                녹음 중지
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 분석 중 단계 */}
        {currentStep === 'processing' && (
          <Card className="shadow-xl border-0 bg-white">
            <CardContent className="p-12 text-center">
              <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <Loader2 className="w-20 h-20 text-white animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                AI가 분석 중입니다...
              </h2>
              <p className="text-gray-600 text-lg">
                잠시만 기다려주세요
              </p>
            </CardContent>
          </Card>
        )}

        {/* 분석 결과 페이지 */}
        {currentStep === 'result' && (
          <Card className="shadow-xl border-0 bg-white relative">
            <CardContent className="p-12 text-center">
              <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <Bot className="w-20 h-20 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                분석 결과
              </h2>
              
              {/* 분석 결과 */}
              <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200 mb-8">
                <h3 className="text-lg font-bold text-green-800 mb-3">🤖 AI 분석 결과</h3>
                <p className="text-green-900 text-lg leading-relaxed whitespace-pre-line">
                  {analysisResult}
                </p>
              </div>
              
              {/* 결과 액션: 검사기록 저장 / PDF 다운로드 / 다시 검사하기 */}
              <div className="flex flex-col gap-3 mb-6">
                {!isLoggedIn && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                    <p className="text-yellow-800 text-sm text-center">
                      💡 로그인하면 검사 기록을 DB에 저장할 수 있습니다
                    </p>
                  </div>
                )}
                
                {/* 새로운 버튼들: 기록보기 / 메인페이지 돌아가기 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    onClick={() => navigate('/voice-consultation-history')}
                    className="h-14 rounded-[12px] bg-[#059669] hover:bg-[#059669] text-white text-lg font-bold"
                  >
                    📋 기록보기
                  </Button>
                  <Button 
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="h-14 rounded-[12px] border-[#059669] text-[#059669] hover:bg-green-50 border-green-force"
                  >
                    🏠 메인페이지
                  </Button>
                </div>
                
                {/* 기존 버튼들: PDF 다운로드 / 다시 검사하기 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    onClick={handleDownloadPDF}
                    className="h-14 rounded-[12px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-lg font-bold"
                    disabled={!analysisResult}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    PDF 다운로드
                  </Button>
                  <Button 
                    onClick={handleRetest}
                    variant="outline"
                    className="h-14 rounded-[12px] border-[#2563eb] text-[#2563eb] hover:bg-blue-50 border-blue-force"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    다시 검사하기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 오류 메시지 */}
        {error && (
          <Card className="border-red-200 bg-red-50 mt-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <p className="font-medium">{error}</p>
              </div>
              {currentStep === 'result' && (
                <div className="mt-3">
                  <Button 
                    onClick={retryRecognition}
                    variant="outline"
                    className="text-sm"
                  >
                    다시 인식하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MemoryHelperFixed;
