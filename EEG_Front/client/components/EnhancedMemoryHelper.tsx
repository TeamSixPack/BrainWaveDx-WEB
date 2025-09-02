import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Send, Loader2, Brain, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface AnalysisResult {
  status: string;
  analysis?: {
    summary: any;
    psychological_state: any;
    cautions: any;
  };
  topic_detection?: any;
  error?: string;
}

const EnhancedMemoryHelper: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const [currentStep, setCurrentStep] = useState<'question' | 'listening' | 'processing' | 'result'>('question');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponse, setUserResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 질문 리스트
  const questions = [
    "자주 쓰던 물건 이름이 갑자기 생각안 난적이 있나요?",
    "대화중단어가 잘 떠오르지 않아서 곤란했던 적이 있나요?",
    "가족이나 지인이 평소와 다르다고 한적이 있나요?",
    "최근에 불편했던 점이나 걱정되는 점이 있나요?"
  ];

  // 음성 녹음 시작
  const startListening = async () => {
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
      setError(null);
      setCurrentStep('listening');
      
    } catch (err) {
      console.error("음성 녹음 시작 실패:", err);
      setError("마이크 접근 권한이 필요합니다.");
    }
  };

  // 음성 녹음 중지
  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  // 오디오 처리 (시뮬레이션)
  const processAudio = async () => {
    // 실제 구현에서는 음성 인식 API 사용
    const simulatedResponse = "네, 최근에 자주 그런 일이 있어요. 물건을 어디에 두었는지 기억이 안 나서 찾는데 시간이 오래 걸려요.";
    setUserResponse(simulatedResponse);
    await analyzeResponse(simulatedResponse);
  };

  // FastAPI로 응답 분석 요청
  const analyzeResponse = async (userResponse: string) => {
    if (!userResponse.trim()) {
      setError("답변을 입력해주세요.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setCurrentStep('processing');

    try {
      const response = await fetch('http://localhost:8001/voice-chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_response: userResponse,
          question_context: questions[currentQuestionIndex],
          session_id: `enhanced-memory-helper-${Date.now()}`,
          user_id: user?.uid || 'anonymous'
        }),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const result = await response.json();
      setAnalysisResult(result);
      setCurrentStep('result');

    } catch (err: any) {
      console.error("분석 요청 실패:", err);
      setError(err.message || "분석 중 오류가 발생했습니다.");
    } finally {
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
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserResponse("");
      setAnalysisResult(null);
      setCurrentStep('question');
    }
  };

  // 처음부터 다시 시작
  const restart = () => {
    setCurrentQuestionIndex(0);
    setUserResponse("");
    setAnalysisResult(null);
    setCurrentStep('question');
    setError(null);
  };

  // 분석 결과 렌더링
  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    if (analysisResult.status === "off_topic") {
      return (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              치매와 무관한 주제
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">입력하신 내용은 치매 상담과 관련이 없습니다.</p>
          </CardContent>
        </Card>
      );
    }

    if (analysisResult.status === "error") {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              분석 오류
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{analysisResult.error}</p>
          </CardContent>
        </Card>
      );
    }

    const { analysis } = analysisResult;
    if (!analysis) return null;

    return (
      <div className="space-y-4">
        {/* 요약 */}
        {analysis.summary && !analysis.summary.error && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                📋 응답 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(analysis.summary).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <Badge variant="outline" className="mr-2">
                    {key.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-sm">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 심리상태 */}
        {analysis.psychological_state && !analysis.psychological_state.error && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                🧠 심리상태 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(analysis.psychological_state).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <Badge variant="outline" className="mr-2">
                    {key.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-sm">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 주의사항 */}
        {analysis.cautions && !analysis.cautions.error && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                ⚠️ 주의사항 및 권장사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(analysis.cautions).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <Badge variant="outline" className="mr-2">
                    {key.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-sm">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎤 AI 향상된 기억력 도우미
          </CardTitle>
          <CardDescription>
            질문 {currentQuestionIndex + 1} / {questions.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 질문 단계 */}
          {currentStep === 'question' && (
            <div>
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">질문:</h3>
                <p className="text-blue-700 text-lg">{questions[currentQuestionIndex]}</p>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <Button
                  onClick={startListening}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2"
                >
                  <Mic className="h-4 w-4" />
                  음성으로 답변
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">또는 직접 텍스트 입력:</label>
                <textarea
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  placeholder="질문에 대한 답변을 입력해주세요..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={4}
                  disabled={isAnalyzing}
                />
                <Button
                  onClick={handleTextSubmit}
                  disabled={!userResponse.trim() || isAnalyzing}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  분석 시작
                </Button>
              </div>
            </div>
          )}

          {/* 음성 듣기 단계 */}
          {currentStep === 'listening' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Mic className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">음성을 듣고 있습니다...</h3>
              <p className="text-gray-600 mb-4">편안하게 답변해 주세요</p>
              <Button onClick={stopListening} variant="destructive">
                <MicOff className="h-4 w-4 mr-2" />
                녹음 중지
              </Button>
            </div>
          )}

          {/* 분석 중 단계 */}
          {currentStep === 'processing' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI가 분석 중입니다...</h3>
              <p className="text-gray-600">잠시만 기다려주세요</p>
            </div>
          )}

          {/* 결과 단계 */}
          {currentStep === 'result' && (
            <div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">답변 내용:</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{userResponse}</p>
                </div>
              </div>

              {renderAnalysisResult()}

              <div className="flex gap-2 mt-6">
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button onClick={nextQuestion} className="flex-1">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    다음 질문
                  </Button>
                ) : (
                  <Button onClick={restart} className="flex-1">
                    처음부터 다시
                  </Button>
                )}
                <Button onClick={restart} variant="outline">
                  다시 시작
                </Button>
              </div>
            </div>
          )}

          {/* 오류 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedMemoryHelper;
