import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Brain, ArrowLeft, ClipboardCheck, FileText, AlertCircle, CheckCircle, Clock, Target, Volume2, VolumeX, RotateCcw, Stethoscope, Microscope } from "lucide-react";
import { useState, useEffect } from "react";

export default function Demo() {
  // TTS 관련 상태
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  
  // 테스트 모드 확인
  const testMode = sessionStorage.getItem('testMode') || 'voice';
  const isVoiceMode = testMode === 'voice';
  
  // 검사 선택 상태
  const [selectedTests, setSelectedTests] = useState<{ [key: string]: boolean }>({
    'MOCA': false,
    'MMSE': false
  });

  const tests = [
    {
      id: 'MOCA',
      icon: Microscope,
      title: "종합 인지검사",
      description: "전반적인 인지 기능을 종합적으로 평가하는 검사",
      duration: "약 3분",
      points: "최대 30점"
    },
    {
      id: 'MMSE',
      icon: Stethoscope,
      title: "간이 인지검사",
      description: "기본적인 인지 기능을 빠르게 평가하는 검사",
      duration: "약 3분", 
      points: "최대 30점"
    }
  ];

  // TTS 기능 함수들
  const speakText = (text: string, autoPlay = true) => {
    // 일반 모드일 때는 TTS 완전 비활성화
    if (!isVoiceMode || !isTTSEnabled || !('speechSynthesis' in window)) return;
    
    // 기존 음성 정지
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;        // 노인 사용자를 위해 느리게
    utterance.volume = 1.0;      // 최대 음량
    utterance.pitch = 1.1;       // 약간 높은 음성으로 명확하게
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    if (autoPlay) {
      speechSynthesis.speak(utterance);
    }
    
    return utterance;
  };

  const stopSpeaking = () => {
    if (!isVoiceMode) return;
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const toggleTTS = () => {
    if (!isVoiceMode) return; // 일반 모드에서는 TTS 토글 불가
    if (isTTSEnabled) {
      stopSpeaking();
    }
    setIsTTSEnabled(!isTTSEnabled);
  };

  // 페이지 로드 시 자동 음성 안내
  const speakPageIntroduction = () => {
    const textToSpeak = "인지 기능 검사 페이지입니다. 종합 인지 평가와 간이 인지 검사를 통해 뇌파 테스트 결과를 뒷받침할 수 있는 인지 기능 상태를 종합적으로 평가합니다. 이 인지 기능 검사들은 뇌파 테스트 결과에 직접적인 영향을 주지는 않지만, 뇌파 테스트 결과를 뒷받침할 수 있는 중요한 근거 자료가 됩니다. 두 검사를 모두 완료하면 더욱 정확하고 종합적인 뇌 건강 상태 분석이 가능합니다.";
    speakText(textToSpeak);
  };

  // 검사 안내 음성 안내
  const speakTestGuide = () => {
    const guideText = "검사 안내입니다. 이 인지 기능 검사들은 뇌파 테스트 결과에 직접적인 영향을 주지는 않지만, 뇌파 테스트 결과를 뒷받침할 수 있는 중요한 근거 자료가 됩니다. 두 검사를 모두 완료하면 더욱 정확하고 종합적인 뇌 건강 상태 분석이 가능합니다.";
    speakText(guideText);
  };

  // 페이지 로드 시 자동 음성 안내
  useEffect(() => {
    if (isTTSEnabled) {
      // 약간의 지연 후 음성 안내 (사용자가 준비할 시간)
      const timer = setTimeout(() => {
        speakPageIntroduction();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isTTSEnabled]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9] p-6">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header with Title */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-3">
            <Brain className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-foreground">NeuroScan</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground leading-tight">
            인지 기능 검사
          </h1>
          
          {/* TTS 컨트롤 버튼들 - 제목 아래에 배치 */}
          {isVoiceMode && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant={isTTSEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleTTS}
                className="h-8 px-2"
                title={isTTSEnabled ? "음성 안내 끄기" : "음성 안내 켜기"}
              >
                {isTTSEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              
              {isTTSEnabled && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={speakPageIntroduction}
                    className="h-8 px-2"
                    title="페이지 소개 다시 듣기"
                    disabled={isSpeaking}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  
                  {isSpeaking && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopSpeaking}
                      className="h-8 px-2"
                      title="음성 정지"
                    >
                      <VolumeX className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* TTS 안내 메시지 */}
          {isVoiceMode && isTTSEnabled && (
            <div className="mt-3 p-2 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-700">
                <Volume2 className="h-4 w-4" />
                <span className="text-sm">
                  {isSpeaking ? "음성 안내 중..." : "페이지 소개가 자동으로 읽혔습니다. 다시 듣려면 🔄 버튼을 클릭하세요."}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Important Notice */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-5xl mx-auto">
          <div className="flex items-start space-x-4">
            <AlertCircle className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
            <div className="text-left flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-blue-800 font-bold text-lg">검사 안내</h3>
              </div>
              <p className="text-blue-700 text-base leading-relaxed">
                이 인지 기능 검사들은 뇌파 테스트 결과에 직접적인 영향을 주지는 않지만,                    
                두 검사를 모두 완료하면 더욱 정확하고 종합적인 뇌 건강 상태 분석이 가능합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Test Overview */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-center text-foreground">
            제공되는 인지 기능 검사
          </h2>

          <div className="grid lg:grid-cols-2 gap-6">
            {tests.map((test, index) => (
              <Card 
                key={index} 
                className={`relative hover:shadow-md transition-all duration-200 cursor-pointer ${
                  selectedTests[test.id] 
                    ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50/50' 
                    : 'hover:bg-blue-50/30'
                }`}
                onClick={() => {
                  setSelectedTests(prev => ({
                    ...prev,
                    [test.id]: !prev[test.id]
                  }));
                }}
              >
                {/* 검사 선택 상태 표시 */}
                <div className="absolute top-4 right-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                    selectedTests[test.id] 
                      ? 'bg-blue-600 !text-white shadow-lg scale-110' 
                      : 'bg-white/80 text-blue-600 border-2 border-blue-300'
                  }`} style={selectedTests[test.id] ? { color: 'white !important' } : {}}>
                    {selectedTests[test.id] ? (
                      <CheckCircle className="h-5 w-5 !text-white" style={{ color: 'white !important' }} />
                    ) : (
                      <ClipboardCheck className="h-4 w-4" />
                    )}
                  </div>
                </div>
                
                {/* 선택 상태 배지 */}
                <div className="absolute top-4 left-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                    selectedTests[test.id] 
                      ? 'bg-blue-600 !text-white' 
                      : 'bg-gray-100 text-gray-500'
                  }`} style={selectedTests[test.id] ? { color: 'white !important' } : {}}>
                    {selectedTests[test.id] ? '선택됨' : '선택 가능'}
                  </div>
                </div>
                
                <CardHeader className="pb-4 pt-12">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <test.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">
                        {test.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {test.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>소요 시간: {test.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <span>총점: {test.points}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Section */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            다음 단계를 선택하세요
          </h2>
          
          {/* 검사 선택 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">검사 선택 안내</span>
            </div>
            <p className="text-sm text-blue-700 text-center">
              {Object.values(selectedTests).some(test => test) 
                ? `선택된 검사: ${Object.entries(selectedTests)
                    .filter(([_, selected]) => selected)
                    .map(([testName]) => testName === 'MOCA' ? '종합인지 평가' : '간이 인지 검사')
                    .join(', ')}`
                : '진행할 검사를 선택해주세요 (둘 다 선택하거나 하나만 선택할 수 있습니다)'
              }
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <Button 
              size="lg" 
              className="flex-1 min-w-[200px] !text-white bg-blue-600 hover:bg-blue-700"
              disabled={!Object.values(selectedTests).some(test => test)}
              style={{ color: 'white !important' }}
              onClick={() => {
                // 선택된 검사 정보를 sessionStorage에 저장
                const selectedTestNames = Object.entries(selectedTests)
                  .filter(([_, selected]) => selected)
                  .map(([testName]) => testName);
                sessionStorage.setItem('selectedTests', JSON.stringify(selectedTestNames));
                
                // 선택된 검사에 따라 다른 페이지로 이동
                if (selectedTestNames.includes('MMSE') && !selectedTestNames.includes('MOCA')) {
                  // MMSE만 선택된 경우 MMSE 페이지로 직접 이동
                  window.location.href = '/mmse';
                } else {
                  // MOCA가 포함된 경우 cognitive-test 페이지로 이동
                  window.location.href = '/cognitive-test';
                }
              }}
            >
              <ClipboardCheck className="h-5 w-5 mr-2 !text-white" style={{ color: 'white !important' }} />
              <span className="!text-white" style={{ color: 'white !important' }}>
                {Object.values(selectedTests).some(test => test) 
                  ? '선택된 검사 진행하기' 
                  : '검사를 선택해주세요'
                }
              </span>
            </Button>
            
            <Button size="lg" variant="outline" asChild className="flex-1 min-w-[200px]">
              <Link to="/results">
                <FileText className="h-5 w-5 mr-2" />
                검사 건너뛰고 결과 보기
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
