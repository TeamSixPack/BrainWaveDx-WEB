import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { startSession, endSession } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Brain, Activity, CheckCircle, AlertCircle, Clock, ArrowLeft, Volume2, VolumeX, RotateCcw } from "lucide-react";

type AssessmentStep = "setup" | "preparation" | "recording" | "processing" | "complete";



export default function Assessment() {
  const [currentStep, setCurrentStep] = useState<AssessmentStep>("setup");
  const [progress, setProgress] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [showSerialGuide, setShowSerialGuide] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected');
  
  // TTS 관련 상태
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  // ttsRate 상태 제거
  
  const { user } = useAuth();
  const [sessionIdx, setSessionIdx] = useState<number | null>(null);

  // 테스트 모드 확인
  const testMode = sessionStorage.getItem('testMode') || 'voice';
  const isVoiceMode = testMode === 'voice';

  // 세션 스토리지에서 시리얼 넘버 불러오기
  useEffect(() => {
    const savedSerialNumber = sessionStorage.getItem('muse2_serial_number');
    if (savedSerialNumber) {
      setSerialNumber(savedSerialNumber);
    }
  }, []);

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

  const repeatInstructions = () => {
    let textToSpeak = "";
    
    if (currentStep === 'setup') {
      textToSpeak = "뇌파 검사를 시작하기 전에 다음 사항들을 확인해주세요.";
    } else if (currentStep === 'preparation') {
      textToSpeak = "뇌파 검사를 위해 장비를 올바르게 착용해주세요.";
    } else if (currentStep === 'recording') {
      textToSpeak = "뇌파 데이터를 측정하고 있습니다. 눈을 감고 편안하게 기다려주세요.";
    } else if (currentStep === 'processing') {
      textToSpeak = "뇌파 데이터를 분석하고 있습니다. 잠시만 기다려주세요.";
    }
    
    speakText(textToSpeak);
  };

  // 체크리스트 음성 안내 함수 추가
  const speakChecklist = () => {
    const checklistText = "시작하기 전에 확인해야 할 사항들입니다. 조용하고 편안한 환경에서 진행해주세요. 안정적인 인터넷 연결을 확인해주세요. 머리 근처의 금속 장신구를 제거해주세요. 안내에 따라 뇌파 헤드셋을 준비해주세요.";
    speakText(checklistText);
  };

  // 시리얼 넘버 안내 음성 함수 추가
  const speakSerialGuide = () => {
    const serialText = "Muse2 헤드밴드의 맨 뒷자리 4자리 숫자만 입력해주세요. 시리얼 넘버는 헤드밴드 내부나 측면에 표시되어 있습니다. 맨 뒷자리 4자리 숫자만 입력하면 됩니다. 예를 들어 2379와 같은 형태입니다. 헤드밴드를 착용한 상태에서 거울을 보거나 다른 사람의 도움을 받아 확인하세요.";
    speakText(serialText);
  };

  // 뇌파 데이터 수집 시작 함수
  const startEegCollection = async (serialNumber: string) => {
    console.log('[DEBUG] startEegCollection 함수 시작, 시리얼 넘버:', serialNumber);
    try {
      // 먼저 preparation 단계로 이동 (헤드밴드 착용 안내)
      console.log('[DEBUG] preparation 단계로 이동');
      setCurrentStep('preparation');
      
              // 헤드밴드 착용 안내 음성
        if (isVoiceMode && isTTSEnabled) {
          speakText("블루투스 연결이 완료되었습니다. 이제 헤드밴드를 착용하고 편안하게 앉아주세요. 전극이 피부와 잘 접촉하는지 확인하고, LED가 녹색인지 확인해주세요. 전극 접촉 상태는 Flask 서버 콘솔에서 실시간으로 확인할 수 있습니다. 준비가 완료되면 측정을 시작하겠습니다.");
        }
      
      // 사용자가 준비할 시간을 주기 위해 5초 대기
      console.log('[DEBUG] 5초 대기 시작');
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('[DEBUG] 5초 대기 완료');
      
      // 이제 실제 뇌파 데이터 수집 시작
      console.log('[DEBUG] Flask API 호출 시작');
      const response = await fetch('http://localhost:8000/start_eeg_collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serialNumber })
      });
      console.log('[DEBUG] Flask API 응답 받음, 상태:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('뇌파 데이터 수집 시작:', result.message);
        
        // 분석 결과가 있으면 저장
        if (result.analysis_result) {
          // 세션 스토리지에 분석 결과 저장
          sessionStorage.setItem('eeg_analysis_result', JSON.stringify(result.analysis_result));
          console.log('뇌파 분석 결과 저장됨:', result.analysis_result);
          
          // 분석이 성공적으로 완료되면 complete 단계로 자동 이동
          if (result.analysis_result.status === 'success') {
            setCurrentStep('complete');
            // 완료 음성 안내
            if (isVoiceMode && isTTSEnabled) {
              speakText("뇌파 검사가 완료되었습니다! 결과를 확인해주세요.");
            }
            return; // 함수 종료
          }
          
          // 분석이 실패했으면 complete 단계로 이동 (실패 결과도 표시)
          if (result.analysis_result.status === 'failed') {
            console.log('뇌파 분석 실패, complete 단계로 이동');
            setCurrentStep('complete');
            // 실패 음성 안내
            if (isVoiceMode && isTTSEnabled) {
              speakText("뇌파 검사가 완료되었지만 분석에 실패했습니다. 결과를 확인해주세요.");
            }
            return; // 함수 종료
          }
        }
        
        // 분석 결과가 없으면 recording 단계로 진행 (기존 로직)
        setCurrentStep('recording');
        setIsRecording(true);
        
        // 성공 음성 안내
        if (isVoiceMode && isTTSEnabled) {
          speakText("뇌파 데이터 수집이 시작되었습니다. 3분간 측정이 진행됩니다. 눈을 감고 편안하게 앉아있어주세요.");
        }
        
      } else {
        const error = await response.json();
        console.error('뇌파 데이터 수집 실패:', error.error);
        
        // 실패 시 setup 단계로 돌아가기
        setCurrentStep('setup');
        
        // 실패 음성 안내
        if (isVoiceMode && isTTSEnabled) {
          speakText("뇌파 데이터 수집에 실패했습니다. 다시 시도해주세요.");
        }
      }
      
    } catch (error) {
      console.error('뇌파 데이터 수집 오류:', error);
      
      // 오류 시 setup 단계로 돌아가기
      setCurrentStep('setup');
      
      // 오류 시 음성 안내
      if (isVoiceMode && isTTSEnabled) {
        speakText("뇌파 데이터 수집 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  };

  // 블루투스 연결 확인 함수
  const checkBluetoothConnection = async () => {
    setBluetoothStatus('connecting');
    
    try {
      // 실제 블루투스 연결 확인 로직 (시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 랜덤으로 연결 성공/실패 결정 (실제로는 실제 블루투스 상태 확인)
      const isConnected = Math.random() > 0.3; // 70% 확률로 연결 성공
      
      if (isConnected) {
        setBluetoothStatus('connected');
        
        // 연결 성공 시 음성 안내
        if (isVoiceMode && isTTSEnabled) {
          speakText("블루투스 연결이 성공했습니다! 이제 뇌파 측정을 진행할 수 있습니다.");
        }
        
        // 블루투스 연결 성공 시 시리얼 넘버가 있으면 뇌파 데이터 수집 시작
        console.log('[DEBUG] 블루투스 연결 성공');
        console.log('[DEBUG] 시리얼 넘버:', serialNumber);
        if (serialNumber) {
          console.log('[DEBUG] startEegCollection 함수 호출 시작');
          startEegCollection(serialNumber);
        } else {
          console.log('[DEBUG] 시리얼 넘버가 없어서 startEegCollection 호출 안됨');
        }
      } else {
        setBluetoothStatus('failed');
        
        // 연결 실패 시 음성 안내
        if (isVoiceMode && isTTSEnabled) {
          speakText("블루투스 연결에 실패했습니다. 헤드밴드 전원과 블루투스 설정을 확인해주세요.");
        }
      }
    } catch (error) {
      setBluetoothStatus('failed');
      
      // 오류 발생 시 음성 안내
      if (isVoiceMode && isTTSEnabled) {
        speakText("블루투스 연결 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  };

  // 전극 배치 음성 안내 함수 추가
  const speakElectrodePlacement = () => {
    const electrodeText = "전극 배치 지침입니다. 첫째, 헤드셋을 머리에 편안하게 착용하세요. 둘째, 4개 전극 모두 피부와 잘 접촉하는지 확인하세요. 셋째, 표시등이 녹색인지 확인하세요. 넷째, 편안히 앉아서 움직이지 마세요.";
    speakText(electrodeText);
  };

  // 뇌파 측정 중 음성 안내 함수 추가
  const speakRecordingInstructions = () => {
    const recordingText = "뇌파 데이터 측정 중입니다. 눈을 감고 편안한 상태를 유지해주세요. 움직이지 말고 갑작스러운 동작을 피해주세요. 2분간 측정이 진행됩니다.";
    speakText(recordingText);
  };

  // 단계 변경 시 자동 음성 안내
  useEffect(() => {
    if (isVoiceMode && !isRecording) {
      let textToSpeak = "";
      
      if (currentStep === 'setup') {
        textToSpeak = "뇌파 검사를 시작하기 전에 다음 사항들을 확인해주세요. 조용하고 편안한 환경에서 진행해주세요. 안정적인 인터넷 연결을 확인해주세요. 머리 근처의 금속 장신구를 제거해주세요. 안내에 따라 뇌파 헤드셋을 준비해주세요.";
      } else if (currentStep === 'preparation') {
        textToSpeak = "뇌파 검사를 위해 장비를 올바르게 착용해주세요. 헤드셋을 머리에 편안하게 착용하세요. 4개 전극 모두 피부와 잘 접촉하는지 확인하세요. 표시등이 녹색인지 확인하세요. 편안히 앉아서 움직이지 마세요.";
      }
      
      if (textToSpeak) {
        // 약간의 지연 후 음성 안내 (사용자가 준비할 시간)
        const timer = setTimeout(() => {
          speakText(textToSpeak);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [currentStep, isVoiceMode, isRecording]);

  // recording 진행률에 따른 자동 음성 안내
  useEffect(() => {
    if (isVoiceMode && currentStep === "recording" && isRecording) {
      let progressText = "";
      
      if (recordingTime === 50) {
        progressText = "측정이 50초 진행되었습니다. 눈을 감고 편안하게 앉아있어주세요.";
      } else if (recordingTime === 100) {
        progressText = "측정이 1분 40초 진행되었습니다. 움직이지 말고 편안한 상태를 유지해주세요.";
      } else if (recordingTime === 130) {
        progressText = "측정이 거의 완료되었습니다. 조금만 더 기다려주세요.";
      } else if (recordingTime === 150) {
        progressText = "뇌파 측정이 완료되었습니다! 데이터를 분석하고 있습니다.";
      }
      
      if (progressText) {
        speakText(progressText);
      }
    }
  }, [recordingTime, currentStep, isRecording, isVoiceMode]);

  const stepProgress = {
    setup: 0,
    preparation: 20,
    recording: 40,
    processing: 80,
    complete: 100
  };

  useEffect(() => {
    if (currentStep === 'recording' && isRecording) {
      // recording 단계에서는 시간에 따라 진행률 계산 (40% ~ 80%)
      const recordingProgress = 40 + (recordingTime / 150) * 40;
      setProgress(Math.min(recordingProgress, 80));
    } else {
      setProgress(stepProgress[currentStep]);
    }
  }, [currentStep, isRecording, recordingTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && recordingTime < 150) { // 2분 30초 = 150 seconds
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 149) {
            setIsRecording(false);
            setCurrentStep("processing");
            // 뇌파 측정 완료 시 음성 안내
            if (isVoiceMode) {
              speakText("뇌파 측정이 완료되었습니다! 데이터를 분석하고 있습니다.");
            }
            return 150;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (recordingTime >= 150) {
      // 150초에 도달했는데도 아직 recording 상태라면 강제로 중단
      setIsRecording(false);
      setCurrentStep("processing");
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingTime, isVoiceMode]);



  const startRecording = () => {
    const begin = async () => {
      try {
        if (!sessionIdx && user?.id) {
          const s = await startSession(user.id);
          const newIdx = s.sessionIdx || null;
          setSessionIdx(newIdx);
          if (newIdx) {
            try { sessionStorage.setItem('currentSessionIdx', String(newIdx)); } catch {}
          }
        }
        // 게스트 모드 사용자는 세션 없이 진행
      } catch (e) { console.error(e); }
      
      // TTS로 녹화 시작 안내
      if (isVoiceMode) {
        speakText("뇌파 기록을 시작합니다. 움직이지 말고 편안하게 앉아있어주세요.");
      }
      
      setIsRecording(true);
      setCurrentStep("recording");
      setRecordingTime(0);
    };
    begin();
  };

  const simulateProcessing = () => {
    // 뇌파 분석이 완료되면 자동으로 complete 단계로 넘어감
    // 이 함수는 더 이상 사용되지 않음
    setTimeout(() => {
      setCurrentStep("complete");
      // 테스트 완료 시 음성 안내
      if (isVoiceMode) {
        speakText("뇌파 검사가 완료되었습니다! 결과를 확인해주세요.");
      }
    }, 3000);
  };

  useEffect(() => {
    if (currentStep === "processing") {
      // 뇌파 분석이 완료되면 자동으로 complete 단계로 넘어가도록 처리
      // startEegCollection에서 분석 완료 시 complete로 설정
      // 더 이상 자동으로 넘어가지 않음
    }
  }, [currentStep]);

  useEffect(() => {
    return () => {
      if (sessionIdx) { endSession(sessionIdx).catch(() => {}); }
    };
  }, [sessionIdx]);



  const handleNext = () => {
    if (currentStep === 'setup') {
      setCurrentStep('preparation');
    } else if (currentStep === 'preparation') {
      setCurrentStep('recording');
      startRecording();
    } else if (currentStep === 'recording') {
      setCurrentStep('processing');
      // simulateProcessing은 useEffect에서 자동으로 처리됨
    } else if (currentStep === 'processing') {
      setCurrentStep('complete');
    }
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
              <span className="text-lg lg:text-xl font-bold text-foreground">NeuroScan</span>
            </div>
          </div>
          {/* <Badge variant="outline" className="text-xs lg:text-sm">
            {currentStep === 'setup' ? '준비' : 
             currentStep === 'preparation' ? '설정' : 
             currentStep === 'recording' ? '측정' : 
             currentStep === 'processing' ? '처리' : '완료'}
          </Badge> */}
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs sm:text-sm font-medium text-foreground">검사 진행률</span>
            <span className="text-xs sm:text-sm text-muted-foreground">{Math.round(progress)}% 완료</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Setup Step */}
        {currentStep === 'setup' && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg sm:text-xl mb-3 sm:mb-4">시작하기 전에</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    뇌파 검사를 시작하기 전에 다음 사항들을 확인해주세요.
                  </CardDescription>
                </div>
                
                {/* TTS 컨트롤 버튼들 - 안내 옆에 배치 */}
                {isVoiceMode && (
                  <div className="flex items-center space-x-2 flex-shrink-0 mt-3 sm:mt-0">
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
                          onClick={repeatInstructions}
                          className="h-8 px-2"
                          title="안내 다시 듣기"
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
              </div>
              
              {/* TTS 안내 메시지 */}
              {isVoiceMode && isTTSEnabled && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">
                      {isSpeaking ? "음성 안내 중..." : "안내가 자동으로 읽혔습니다. 다시 듣려면 🔄 버튼을 클릭하세요."}
                    </span>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {!user && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center text-sm sm:text-base">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    비회원 모드로 진행 중
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-700">
                    로그인하지 않은 상태로 검사를 진행합니다. 결과는 PDF로 다운로드할 수 있지만,
                    검사 기록은 저장되지 않습니다. 기록을 저장하려면 로그인 후 다시 검사를 진행해주세요.
                  </p>
                </div>
              )}
              
              {/* 시리얼 넘버 입력 섹션 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Muse2 헤드밴드 시리얼 넘버
                  </h3>
                  <div className="flex items-center space-x-2">
                    {isVoiceMode && isTTSEnabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={speakSerialGuide}
                        className="h-8 px-2 text-blue-600 hover:text-blue-700"
                        title="시리얼 넘버 음성 안내"
                        disabled={isSpeaking}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSerialGuide(!showSerialGuide)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      {showSerialGuide ? '가이드 숨기기' : '가이드 보기'}
                    </Button>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  {/* 시리얼 넘버 입력 */}
                  <div className="space-y-3">
                    <Label htmlFor="serialNumber" className="text-blue-700 font-medium">
                      시리얼 넘버 입력
                    </Label>
                    <Input
                      id="serialNumber"
                      type="text"
                      placeholder="맨 뒷자리 4자리 숫자만 입력 (예: 2379)"
                      value={serialNumber}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSerialNumber(value);
                        // 시리얼 넘버를 세션 스토리지에 저장
                        sessionStorage.setItem('muse2_serial_number', value);
                        // 시리얼 넘버 입력 시 자동으로 가이드 표시
                        if (value.trim() && !showSerialGuide) {
                          setShowSerialGuide(true);
                        }
                      }}
                      className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                    />

                    {serialNumber && !/^\d{4}$/.test(serialNumber) && (
                      <p className="text-sm text-orange-600">
                        ⚠️ 맨 뒷자리 4자리 숫자만 입력해주세요 (예: 2379)
                      </p>
                    )}
                  </div>
                  
                  {/* 시리얼 넘버 가이드 */}
                  {showSerialGuide && (
                    <div className="space-y-3">
                      <Label className="text-blue-700 font-medium">시리얼 넘버 위치 가이드</Label>
                      <div className="bg-white border border-blue-200 rounded-lg p-4">
                        <div className="text-center space-y-3">
                          {/* 실제 Muse2 헤드밴드 이미지 */}
                          <div className="relative">
                            <img 
                              src="/images/muse2-serial-guide.png" 
                              alt="Muse2 헤드밴드 시리얼 넘버 위치 가이드"
                              className="w-full max-w-xs mx-auto rounded-lg border border-gray-200"
                              onError={(e) => {
                                // 이미지 로드 실패 시 기본 도식 표시
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'block';
                              }}
                            />
                            {/* 이미지 로드 실패 시 표시할 기본 도식 */}
                            <div className="w-20 h-20 bg-gray-100 rounded-lg mx-auto flex items-center justify-center border-2 border-dashed border-blue-300 hidden">
                              <span className="text-xs text-gray-500 font-medium">Muse2</span>
                            </div>
                          </div>
                          <div className="text-sm text-blue-700 space-y-2">
                            <p><strong>위치:</strong> 착용했을 때 왼쪽 귀 바로 옆, 헤드밴드 안쪽 부분에 인쇄되어 있습니다</p>
                            <p><strong>형식:</strong> SN : XXXX-XXXX-<strong>여기4자리</strong></p>
                            <p><strong>예시:</strong> 2379</p>
                          </div>
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                            <p className="text-xs text-yellow-700">
                              💡 <strong>맨 뒷자리 4자리 숫자만 입력해주세요</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">시작하기 전에:</h3>
                  {/* 체크리스트 음성 안내 버튼 */}
                  {isVoiceMode && isTTSEnabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={speakChecklist}
                      className="h-8 px-2 text-blue-600 hover:text-blue-700"
                      title="체크리스트 음성 안내"
                      disabled={isSpeaking}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>조용하고 편안한 환경에서 진행해주세요</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>머리 근처의 금속 장신구를 제거해주세요</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>안내에 따라 뇌파 헤드셋을 준비해주세요</span>
                  </li>
                </ul>
              </div>

              <div className="text-center space-y-3 sm:space-y-4">
                <Button 
                  onClick={() => setCurrentStep("preparation")} 
                  size="lg" 
                  className="px-6 sm:px-8 w-full sm:w-auto"
                  disabled={!serialNumber.trim() || !/^\d{4}$/.test(serialNumber)}
                >
                  {serialNumber.trim() && /^\d{4}$/.test(serialNumber) 
                    ? '시작할 준비가 되었습니다' 
                    : '시리얼 넘버를 입력해주세요'}
                </Button>
                
                {(!serialNumber.trim() || !/^\d{4}$/.test(serialNumber)) && (
                  <p className="text-sm text-orange-600">
                    ⚠️ Muse2 헤드밴드의 맨 뒷자리 4자리 숫자를 입력해야 검사를 진행할 수 있습니다
                  </p>
                )}

                <div className="flex flex-col items-center">
                  <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                    <Link to="/cognitive-test">
                      뇌파 검사 건너뛰기
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    인지 기능 검사로 바로 이동합니다
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preparation Step */}
        {currentStep === 'preparation' && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg sm:text-xl mb-3 sm:mb-4">장비를 착용해 주세요</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    뇌파 검사를 위해 장비를 올바르게 착용해주세요.
                  </CardDescription>
                </div>
                
                {/* TTS 컨트롤 버튼들 - 안내 옆에 배치 */}
                {isVoiceMode && (
                  <div className="flex items-center space-x-2 flex-shrink-0 mt-3 sm:mt-0">
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
                          onClick={repeatInstructions}
                          className="h-8 px-2"
                          title="안내 다시 듣기"
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
              </div>
              
              {/* TTS 안내 메시지 */}
              {isVoiceMode && isTTSEnabled && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">
                      {isSpeaking ? "음성 안내 중..." : "안내가 자동으로 읽혔습니다. 다시 듣려면 🔄 버튼을 클릭하세요."}
                    </span>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">장비 확인:</h3>
                    {/* 전극 배치 음성 안내 버튼 */}
                    {isTTSEnabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={speakElectrodePlacement}
                        className="h-8 px-2 text-blue-600 hover:text-blue-700"
                        title="전극 배치 음성 안내"
                        disabled={isSpeaking}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                      <span className="text-muted-foreground">헤드셋을 머리에 편안하게 착용하세요</span>
                    </div>
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                      <span className="text-muted-foreground">블루투스 연결 상태를 확인하세요</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</div>
                      <span className="text-muted-foreground">편안히 앉아서 움직이지 마세요</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-foreground">신호 품질 확인</h4>
                    <Button
                      onClick={checkBluetoothConnection}
                      disabled={bluetoothStatus === 'connecting'}
                      size="sm"
                      variant={bluetoothStatus === 'connected' ? 'default' : bluetoothStatus === 'failed' ? 'destructive' : 'outline'}
                      className="text-xs"
                    >
                      {bluetoothStatus === 'connecting' ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          연결 중...
                        </>
                      ) : bluetoothStatus === 'connected' ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-2" />
                          연결됨
                        </>
                      ) : bluetoothStatus === 'failed' ? (
                        <>
                          <AlertCircle className="w-3 h-3 mr-2" />
                          연결 실패
                        </>
                      ) : (
                        <>
                          <Activity className="w-3 h-3 mr-2" />
                          블루투스 연결 확인
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* 블루투스 연결 상태 메시지 */}
                  {bluetoothStatus === 'connected' && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">블루투스 연결 성공!</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Muse2 헤드밴드가 성공적으로 연결되었습니다. 이제 뇌파 측정을 진행할 수 있습니다.
                      </p>
                    </div>
                  )}
                  
                  {bluetoothStatus === 'failed' && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">블루투스 연결 실패</span>
                      </div>
                      <p className="text-xs text-red-600 mt-1">
                        헤드밴드 전원이 켜져 있는지, 블루투스가 활성화되어 있는지 확인해주세요.
                      </p>
                    </div>
                  )}
                  
                  {/* 블루투스 연결 상태만 표시 */}
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      블루투스 연결 확인 버튼을 눌러<br />
                      Muse2 헤드밴드 연결 상태를 확인하세요
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-center space-y-4">
                <Button 
                  onClick={startRecording} 
                  size="lg" 
                  className="px-8"
                  disabled={bluetoothStatus !== 'connected'}
                >
                  {bluetoothStatus === 'connected' ? "녹화 시작" : 
                   bluetoothStatus === 'connecting' ? "블루투스 연결 중..." : 
                   bluetoothStatus === 'failed' ? "블루투스 연결 실패" : 
                   "블루투스 연결 확인 필요"}
                </Button>
                
                {bluetoothStatus !== 'connected' && (
                  <p className="text-sm text-orange-600">
                    ⚠️ 블루투스 연결 확인 버튼을 눌러 헤드밴드 연결 상태를 확인해주세요
                  </p>
                )}

                <div className="flex flex-col items-center">
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/cognitive-test">
                      뇌파 검사 건너뛰기
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    인지 기능 검사로 바로 이동합니다
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recording Step */}
        {currentStep === "recording" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Activity className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">뇌파 데이터 측정 중</CardTitle>
              <CardDescription className="text-lg">
                녹화하는 동안 눈을 감고 편안한 상태를 유지해 주세요
              </CardDescription>
              
              {/* TTS 안내 메시지 */}
              {isVoiceMode && isTTSEnabled && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-blue-700">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">
                      {isSpeaking ? "음성 안내 중..." : "뇌파 측정 안내가 자동으로 읽혔습니다. 다시 듣려면 🔄 버튼을 클릭하세요."}
                    </span>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-8">
                
                
                {/* 진행률 표시 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">진행률</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{Math.round((recordingTime / 120) * 100)}%</span>
                      {/* 진행률 음성 안내 버튼 */}
                      {isTTSEnabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={speakRecordingInstructions}
                          className="h-6 px-2 text-blue-600 hover:text-blue-700"
                          title="측정 진행 상황 음성 안내"
                          disabled={isSpeaking}
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Progress value={(recordingTime / 120) * 100} className="h-3" />
                  
                  {/* 진행률에 따른 동적 안내 메시지 */}
                  {isTTSEnabled && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {recordingTime < 30 && "측정 초기 단계입니다. 눈을 감고 편안하게 앉아있어주세요."}
                        {recordingTime >= 30 && recordingTime < 60 && "측정이 진행 중입니다. 움직이지 말고 편안한 상태를 유지해주세요."}
                        {recordingTime >= 60 && recordingTime < 90 && "측정이 절반 이상 진행되었습니다. 조금만 더 기다려주세요."}
                        {recordingTime >= 90 && recordingTime < 120 && "측정이 거의 완료되었습니다. 마지막까지 편안하게 기다려주세요."}
                        {recordingTime >= 120 && "측정이 완료되었습니다!"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Skip Button */}
              <div className="pt-4 flex flex-col items-center">
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="px-8"
                >
                  <Link to="/cognitive-test">
                    뇌파 검사 건너뛰기
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  인지 기능 검사로 바로 이동합니다
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Step */}
        {currentStep === "processing" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <CardTitle className="text-2xl">뇌파 데이터 분석 중</CardTitle>
              <CardDescription className="text-lg">
                AI가 귀하의 뇌파 패턴을 처리하고 있습니다
              </CardDescription>
              
              {/* TTS 안내 메시지 */}
              {isTTSEnabled && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-blue-700">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">
                      {isSpeaking ? "음성 안내 중..." : "데이터 분석 안내가 자동으로 읽혔습니다. 다시 듣려면 🔄 버튼을 클릭하세요."}
                    </span>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">신호 전처리</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">특징 추출</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI 패턴 분석</span>
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-opacity-50">보고서 생성</span>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  처리는 일반적으로 1-2분이 소요됩니다. 이 창을 닫지 마세요.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Step */}
        {currentStep === "complete" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">검사 완료!</CardTitle>
              <CardDescription className="text-lg">
                뇌파 검사 결과를 검토할 준비가 되었습니다
              </CardDescription>
              
              {/* TTS 안내 메시지 */}
              {isTTSEnabled && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-blue-700">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">
                      {isSpeaking ? "음성 안내 중..." : "검사 완료 안내가 자동으로 읽혔습니다. 다시 듣려면 🔄 버튼을 클릭하세요."}
                    </span>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  뇌파가 성공적으로 분석되었습니다.
                  다음 단계로 진행하여 인지 기능 검사를 완료하세요.
                </p>
              </div>

              <div className="flex justify-center">
                <Button size="lg" asChild>
                  <Link to="/demo">다음 단계 계속하기</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
