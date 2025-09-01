import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Upload, Bot, Volume2, ArrowRight, CheckCircle, AlertCircle, Home, RotateCcw, Square, CheckSquare, Lock } from "lucide-react";
import QuestionSelector from "@/components/memory-helper/QuestionSelector";
import { useState, useEffect, useRef } from "react";

type Step = 'start' | 'welcome' | 'question' | 'recording' | 'processing' | 'result';

export default function MemoryHelper() {
  const [currentStep, setCurrentStep] = useState<Exclude<Step, 'welcome'>>('start');
  const [isRecording, setIsRecording] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthLevel, setMouthLevel] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const recognizedTextRef = useRef<string>('');
  const interimTextRef = useRef<string>('');
  const fullTextRef = useRef<string>('');
  
  // 날짜 포맷터 (YYYY-MM-DD)
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouthAnimRef = useRef<number | null>(null);
  const hasSpokenStartHintRef = useRef<boolean>(false);
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [isResultReady, setIsResultReady] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [hasRequestedMic, setHasRequestedMic] = useState(false);

  // 사용자 발화 기반 간단 요약/분석 생성기
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
          setIsSpeaking(true);
          // 간단한 입모양 애니메이션 시작 (레벨 0~3 반복)
          try {
            if (mouthAnimRef.current) clearInterval(mouthAnimRef.current);
          } catch {}
          mouthAnimRef.current = window.setInterval(() => {
            setMouthLevel(prev => (prev + 1) % 4);
          }, 140);
        };
        
        // 경계 이벤트: 단어/문장 경계에 맞춰 입모양을 잠시 크게
        utterance.onboundary = () => {
          try {
            setMouthLevel(3);
            setTimeout(() => setMouthLevel(1), 120);
          } catch {}
        };

        utterance.onend = () => {
          console.log('음성 완료:', message);
          setIsSpeaking(false);
          try { if (mouthAnimRef.current) { clearInterval(mouthAnimRef.current); mouthAnimRef.current = null; } } catch {}
          setMouthLevel(0);
          // 음성이 완전히 끝난 후 콜백 실행
          if (onComplete) {
            onComplete();
          }
        };
        
        utterance.onerror = (event) => {
          console.error('음성 합성 오류:', event);
          setIsSpeaking(false);
          try { if (mouthAnimRef.current) { clearInterval(mouthAnimRef.current); mouthAnimRef.current = null; } } catch {}
          setMouthLevel(0);
          // 오류 발생 시에도 콜백 실행
          if (onComplete) {
            onComplete();
          }
        };
        
        // 음성 재생 시작
        speechSynthesis.speak(utterance);
        
    } catch (error) {
        console.error('음성 합성 초기화 오류:', error);
        setIsSpeaking(false);
        // 오류 발생 시에도 콜백 실행
        if (onComplete) {
          onComplete();
        }
      }
    } else {
      console.warn('음성 합성을 지원하지 않는 브라우저입니다.');
      setIsSpeaking(false);
      if (onComplete) {
        onComplete();
      }
    }
  };

  // 안내 시작 버튼 클릭 시
  const handleStartGuide = () => {
    // 안내 단계 제거: 바로 질문 선택으로 이동하고 음성만 안내
    setCurrentStep('question');
    speakMessage('현재 페이지에서 어떤 질문에 대해 이야기 해보고 싶은지 편하게 선택해주세요.');
  };

  // 질문 선택 처리
  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  // 선택된 질문으로 대화 시작
  const handleStartConversation = () => {
    if (selectedQuestions.length > 0) {
      setCurrentQuestionIndex(0);
      startQuestionConversation();
    }
  };

  // 질문 대화 시작
  const startQuestionConversation = () => {
    const selectedQuestion = experienceQuestions.find(q => q.id === selectedQuestions[currentQuestionIndex]);
    if (selectedQuestion) {
      // 음성 길이 계산 (한국어 기준: 초당 약 3-4음절)
      const estimatedDuration = (selectedQuestion.question.length * 0.3) + 1; // 초 단위, 여유시간 1초 추가
      
      speakMessage(selectedQuestion.question, () => {
        // 음성 합성이 완료된 후 녹음 시작
        setTimeout(() => {
          setCurrentStep('recording');
          // 녹음 단계 진입 시 권한 흐름 처리
          handleEnterRecordingStep();
        }, 100); // 음성 합성 완료 후 진행
      });
    }
  };

  // 녹음 단계 진입 시 권한 요청 → 허용 시 자동 녹음 시작
  const handleEnterRecordingStep = async () => {
    try {
      // 권한 상태가 불명확할 때는 우선 쿼리
      if (navigator.permissions && (navigator.permissions as any).query) {
        try {
          const status = await (navigator.permissions as any).query({ name: 'microphone' as any });
          setMicPermission(status.state as any);
        } catch {}
      }
      if (micPermission !== 'granted') {
        // 권한 프롬프트를 띄워 사용자가 허용하도록 유도 (오디오만 요청)
        setHasRequestedMic(true);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // 권한이 허용되면 즉시 스트림을 닫고 실제 녹음 시작
        stream.getTracks().forEach(t => t.stop());
        setMicPermission('granted');
        setTimeout(() => { if (!isRecording) startRecording(); }, 120);
      } else {
        if (!isRecording) startRecording();
      }
    } catch (e) {
      // 사용자가 거부하면 안내만 표시하고 버튼으로 재요청 가능
      setMicPermission('denied');
      setMicActive(false);
    }
  };

  // 다음 질문으로 진행
  const goToNextQuestion = () => {
    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserResponse('');
      startQuestionConversation();
    } else {
      // 모든 질문 완료, 분석 단계로
      setCurrentStep('processing');
    }
  };

  // 대답하기 버튼 클릭 시
  const handleStartAnswer = () => {
    setCurrentStep('recording');
    startRecording();
  };

  // 음성 녹음 시작
  const startRecording = async () => {
    try {
      // 권한 상태 갱신 시도
      if (navigator.permissions && (navigator.permissions as any).query) {
        try {
          const status = await (navigator.permissions as any).query({ name: 'microphone' as any });
          setMicPermission(status.state as any);
          status.onchange = () => setMicPermission((status as any).state);
        } catch {}
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      setMicPermission('granted');
      setMicActive(true);
      
      // STT 초기화 및 시작 (Web Speech API)
      setRecognizedText('');
      recognizedTextRef.current = '';
      interimTextRef.current = '';
      fullTextRef.current = '';
      const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = 'ko-KR';
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event: any) => {
          try {
            let finals: string[] = [];
            let latestInterim = '';
            const total = event.results.length;
            for (let i = 0; i < total; i++) {
              const res = event.results[i];
              const text = res && res[0] ? String(res[0].transcript || '') : '';
              if (!text) continue;
              if (res.isFinal) {
                finals.push(text.trim());
              } else {
                latestInterim = text.trim();
              }
            }
            const combined = (finals.join(' ') + (latestInterim ? ' ' + latestInterim : '')).trim();
            recognizedTextRef.current = combined;
            fullTextRef.current = combined;
            interimTextRef.current = latestInterim;
            setRecognizedText(combined);
            // 인식 이벤트가 계속 들어오는 동안 자동 종료 방지: 보호 타이머 연장
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }
            silenceTimerRef.current = setTimeout(() => {
              if (isRecording) {
                stopRecording();
              }
            }, 6000);
          } catch (e) {
            console.warn('STT onresult 처리 오류:', e);
          }
        };
        recognition.onerror = (e: any) => {
          console.error('STT 오류:', e);
          // 녹음 중에 종료 에러가 발생하면 즉시 재시도 (일시적 오류 대비)
          try {
            if (isRecording && recognition) {
              setTimeout(() => {
                try { recognition.start(); } catch {}
              }, 150);
            }
          } catch {}
        };
        recognition.onend = () => {
          // 녹음이 계속 진행 중이면 자동 재시작하여 인식을 이어감
          try {
            if (isRecording && recognition) {
              setTimeout(() => {
                try { recognition.start(); } catch {}
              }, 100);
            }
          } catch {}
        };
        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (e) {
          console.warn('STT 시작 중 예외:', e);
        }
      } else {
        console.warn('이 브라우저는 Web Speech API 인식을 지원하지 않습니다.');
      }
      
      const options: MediaRecorderOptions = { mimeType: 'audio/webm;codecs=opus' } as any;
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // 트랙 정지 및 WebAudio 해제만 수행 (STT 완료 후 처리)
        stream.getTracks().forEach(track => track.stop());
        // WebAudio 해제
        if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
        if (audioContextRef.current) {
          try { await audioContextRef.current.close(); } catch {}
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        sourceNodeRef.current = null;
        setMicActive(false);
      };
      
      mediaRecorder.start();
      setIsRecording(true);

      // WebAudio 시각화 초기화
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current) {
        const ctx = audioContextRef.current;
        // 일부 브라우저에서 AudioContext가 'suspended' 상태로 시작하는 문제 대응
        try { if (ctx.state === 'suspended') { await ctx.resume(); } } catch {}
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 1024;
        sourceNodeRef.current = ctx.createMediaStreamSource(stream);
        sourceNodeRef.current.connect(analyserRef.current);
        // 캔버스 렌더가 완료되었음을 보장하기 위해 약간 지연 후 그리기 시작
        setTimeout(() => { drawWaveform(); }, 60);
      }
      
      // 12초 후 자동으로 녹음 중지 (보호 타이머)
      silenceTimerRef.current = setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 12000);
      
    } catch (error) {
      console.error('녹음 시작 오류:', error);
      setUserResponse('마이크 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해주세요.');
      setMicPermission('denied');
    }
  };

  // 음성 녹음 중지
  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
    // STT 정지
    if (recognitionRef.current) {
      const recog = recognitionRef.current;
      const waitEnd = new Promise(resolve => {
        try {
          const prevOnEnd = recog.onend;
          recog.onend = (...args: any[]) => {
            try { if (prevOnEnd) prevOnEnd.apply(recog, args as any); } catch {}
            resolve(null);
          };
        } catch { resolve(null); }
      });
      try { recog.stop(); } catch (e) { console.warn('STT 중지 중 예외:', e); }
      await Promise.race([waitEnd, new Promise(r => setTimeout(r, 2000))]);
      recognitionRef.current = null;
    }
    // 마지막 interim 텍스트를 최종 결과에 병합 (잘림 방지)
    if (interimTextRef.current && interimTextRef.current.trim().length > 0) {
      const interim = interimTextRef.current.trim();
      const currentFinal = (recognizedTextRef.current || '').trim();
      // 이미 포함되지 않았다면 항상 병합
      if (!currentFinal.endsWith(interim)) {
        recognizedTextRef.current = (currentFinal ? currentFinal + ' ' : '') + interim;
        setRecognizedText(recognizedTextRef.current);
      }
    }
    // 최종 버퍼가 비어있다면 fullTextRef 사용
    if ((!recognizedTextRef.current || recognizedTextRef.current.trim().length === 0) && fullTextRef.current.trim().length > 0) {
      recognizedTextRef.current = fullTextRef.current.trim();
      setRecognizedText(recognizedTextRef.current);
    }
    // WebAudio 해제 (수동 중지 시점)
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    if (audioContextRef.current) {
      try { await audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    sourceNodeRef.current = null;

    // STT가 끝난 뒤에 오디오 처리 시작
    if (audioChunksRef.current && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await processAudio(audioBlob);
      audioChunksRef.current = [];
    } else {
      await processAudio(new Blob());
    }
  };

  // 오디오 처리 (STT 시뮬레이션)
  const processAudio = async (audioBlob: Blob) => {
    // 실제 STT API 호출 대신 약간의 지연 후 처리
    setTimeout(() => {
      const currentQuestion = experienceQuestions.find(q => q.id === selectedQuestions[currentQuestionIndex]);
      // 실제 인식된 텍스트 사용
      const finalAnswer =
        recognizedTextRef.current && recognizedTextRef.current.trim().length > 0
          ? recognizedTextRef.current.trim()
          : (fullTextRef.current && fullTextRef.current.trim().length > 0
              ? fullTextRef.current.trim()
              : (interimTextRef.current && interimTextRef.current.trim().length > 0
                  ? interimTextRef.current.trim()
                  : (recognizedText && recognizedText.trim().length > 0
                      ? recognizedText.trim()
                      : '음성이 인식되지 않았어요. 다시 시도해 주세요.')));
      setUserResponse(`질문: ${currentQuestion?.question}\n답변: ${finalAnswer}`);
      setIsAnalyzing(false);
      setCurrentStep('processing');
    }, 400);
  };

  // 분석 시작
  const handleStartAnalysis = () => {
    // 모든 질문이 완료되었는지 확인
    if (currentQuestionIndex < selectedQuestions.length - 1) {
      // 다음 질문으로 진행
      goToNextQuestion();
    } else {
      // 모든 질문 완료, 분석 시작
      setIsAnalyzing(true);
      setCurrentStep('processing');
      setIsResultReady(false);
      // 안내 음성 끝난 뒤 결과 생성
      speakMessage('분석을 시작합니다. 잠시만 기다려주세요.', () => {
        // TTS 완료 후 실제 분석 로직 (시뮬레이션)
        setTimeout(() => {
          const dateStr = formatDate(new Date());
          const lastQuestionId = selectedQuestions[Math.min(currentQuestionIndex, selectedQuestions.length - 1)];
          const lastQuestion = experienceQuestions.find(q => q.id === lastQuestionId);
          const questionText = lastQuestion ? lastQuestion.question : '질문 내용';
          const answerText = (() => {
            const idx = userResponse.indexOf('답변:');
            return idx !== -1 ? userResponse.slice(idx + 3).replace(':', '').trim() : userResponse;
          })();

          const ai = buildAnalysisFromAnswer(answerText);
          const report = `📝 인지건강 상담 기록 (${dateStr})\n\n[사용자 발화 기록]\n\n- 질문: ${questionText}\n- 답변: ${answerText}\n\n[AI 요약]\n\n- 요약: ${ai.summary}\n- 분석: ${ai.analysis}\n- 안내: ${ai.guidance}`;

          setAnalysisResult(report);
          setIsAnalyzing(false);
          setIsResultReady(true);
          setCurrentStep('result');
        }, 1200);
      });
    }
  };

  // 검사기록 저장
  const saveAnalysisRecord = () => {
    try {
      const dateStr = formatDate(new Date());
      const record = {
        date: dateStr,
        raw: analysisResult,
        step: currentStep,
        selectedQuestions,
        userResponse,
      };
      const key = 'inspection_records';
      const prev = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      const arr = prev ? JSON.parse(prev) : [];
      arr.push(record);
      localStorage.setItem(key, JSON.stringify(arr));
      alert('검사기록에 저장되었습니다.');
    } catch (e) {
      console.error('저장 오류:', e);
      alert('저장 중 문제가 발생했습니다.');
    }
  };

  // 결과 PDF 다운로드 (브라우저 인쇄-PDF 활용)
  const handleDownloadPDF = () => {
    try {
      const dateStr = formatDate(new Date());
      const printable = `
        <html>
          <head>
            <meta charset="utf-8" />
            <title>AI 분석 결과 - ${dateStr}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', Arial, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; padding: 32px; color: #0f172a; }
              .title { font-size: 22px; font-weight: 800; margin-bottom: 12px; }
              .meta { color: #334155; margin-bottom: 20px; }
              .box { border: 2px solid #93c5fd; background:#eff6ff; border-radius: 12px; padding: 16px; white-space: pre-line; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="title">AI 분석 결과</div>
            <div class="meta">작성일: ${dateStr}</div>
            <div class="box">${analysisResult || ''}</div>
            <script>window.onload = () => { setTimeout(() => { window.print(); }, 60); };<\/script>
          </body>
        </html>
      `;
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(printable);
        win.document.close();
      }
    } catch (e) {
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  };

  // 다시 검사하기: 질문 단계로 초기화
  const handleRetest = () => {
    setUserResponse('');
    setAnalysisResult('');
    setRecognizedText('');
    recognizedTextRef.current = '';
    interimTextRef.current = '';
    fullTextRef.current = '';
    setSelectedQuestions([]);
    setCurrentQuestionIndex(0);
    setIsAnalyzing(false);
    setIsResultReady(false);
    setCurrentStep('start');
  };

  // 분석 즉시 실행 (녹음 단계용)
  const analyzeNowFromRecording = async () => {
    try {
      if (isSpeaking) {
        // 안내 음성 중에는 분석을 막음
        return;
      }
    if (isRecording) {
        // 녹음 중이면 먼저 중지 → onstop 에서 STT 처리
      stopRecording();
        return;
      }
      // 녹음이 이미 중지된 경우, 남아있는 버퍼로 처리 (안전장치)
      if (audioChunksRef.current && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        audioChunksRef.current = [];
      }
    } catch (e) {
      console.error('즉시 분석 오류:', e);
    }
  };

  // 재인식 (처리 페이지에서 호출)
  const retryRecognition = async () => {
    try {
      // 진행 중 녹음/시각화 정리
      if (isRecording) {
        await stopRecording();
      }
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    } catch {}
    // STT 버퍼 초기화
    setRecognizedText('');
    recognizedTextRef.current = '';
    interimTextRef.current = '';
    fullTextRef.current = '';
    setUserResponse('');
    setIsAnalyzing(false);
    // 현재 질문을 다시 말한 뒤 완료되면 자동 녹음으로 진입
    startQuestionConversation();
  };

  // 처음부터 다시 시작
  const resetToStart = () => {
    setCurrentStep('start');
    setUserResponse('');
    setAnalysisResult('');
    setIsRecording(false);
    setRecognizedText('');
    recognizedTextRef.current = '';
    interimTextRef.current = '';
    fullTextRef.current = '';
    setSelectedQuestions([]);
    setCurrentQuestionIndex(0);
    setIsAnalyzing(false); // 분석 상태도 초기화
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    sourceNodeRef.current = null;
  };

  // 이전 단계로 돌아가기
  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'question':
        setCurrentStep('start');
        break;
      case 'recording':
        setCurrentStep('question');
        break;
      case 'processing':
        if (currentQuestionIndex > 0) {
          // 이전 질문으로 돌아가기
          setCurrentQuestionIndex(prev => prev - 1);
          setUserResponse('');
          setCurrentStep('recording');
          startQuestionConversation();
        } else {
          // 질문 선택 단계로 돌아가기
          setCurrentStep('question');
          setCurrentQuestionIndex(0);
          setUserResponse('');
        }
        break;
      case 'result':
        setCurrentStep('processing');
        break;
      default:
        break;
    }
  };

  // 상단 바는 페이지 컴포넌트에서 렌더링하므로 여기서는 제거
  const renderBackButton = () => null;

  // 상단 진행 안내 배너/헤더 행 (모든 단계 중앙 정렬 배지)
  const renderHeaderRow = () => {
    const stageTextMap: Record<'start' | 'question' | 'recording' | 'processing' | 'result', string> = {
      start: '지금은 시작 단계입니다',
      question: '지금은 질문 단계입니다',
      recording: '지금은 녹음 단계입니다',
      processing: '지금은 분석 단계입니다',
      result: '지금은 결과 단계입니다',
    };
    const text = stageTextMap[currentStep as 'start' | 'question' | 'recording' | 'processing' | 'result'];
    return (
      <div className="w-full mb-4 sm:mb-6">
        <div className="w-full bg-white/90 border border-[#0052CC] rounded-xl py-3 sm:py-4 px-4 sm:px-6 shadow-sm flex items-center justify-center text-center">
          <div aria-live="polite" className="text-[#003A8C] font-bold text-base sm:text-xl">
            {text}
          </div>
        </div>
      </div>
    );
  };

  // 메인으로 이동
  const goToHome = () => {
    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    } finally {
      window.location.href = '/';
    }
  };

  // 도움 요청 기능 제거 (요청에 따라 버튼 비노출)
  
  // 텍스트만 보이는 진행바
  const renderSpeechProgressBar = () => {
    const steps: Array<{ step: Exclude<Step, 'welcome'>; label: string }> = [
      { step: 'start', label: '시작' },
      { step: 'question', label: '질문' },
      { step: 'recording', label: '녹음' },
      { step: 'processing', label: '분석' },
      { step: 'result', label: '결과' },
    ];
    const currentIndex = Math.max(0, steps.findIndex(s => s.step === currentStep));
    const totalCols = steps.length * 2 - 1; // step,gap,step,gap...
    return (
      <div className="w-full bg-white/80 border border-gray-200 rounded-xl px-6 py-5 mb-6">
        {/* 상단: 그리드로 원/커넥터 배치 (정중앙) */}
        <div
          className="grid items-center"
          style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}
        >
          {steps.map((_, idx) => {
            const isCurrent = idx === currentIndex;
            const isPast = idx < currentIndex;
            const circleCol = idx * 2 + 1; // 1-based
            return (
              <>
                <div
                  key={`circle-${idx}`}
                  className="flex items-center justify-center"
                  style={{ gridColumn: circleCol }}
                >
                  <div
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                      isPast
                        ? 'bg-[#0A53BE] border-[#0A53BE] text-white'
                        : isCurrent
                          ? 'bg-[#0A53BE] border-[#0A53BE] text-white'
                          : 'bg-white border-[#C9D7F5] text-gray-400'
                    }`}
                  >
                    <span className={isPast ? 'text-white' : ''}>{idx + 1}</span>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    key={`dash-${idx}`}
                    className="flex items-center justify-center"
                    style={{ gridColumn: circleCol + 1 }}
                  >
                    <div className={`h-[2px] w-12 rounded ${idx < currentIndex ? 'bg-[#0A53BE]' : 'bg-[#C9D7F5]'}`}></div>
                  </div>
                )}
              </>
            );
          })}
        </div>
        {/* 하단: 동일 그리드에 라벨을 원 바로 아래 정중앙에 배치 */}
        <div
          className="grid mt-2"
          style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}
        >
          {steps.map(({ label }, idx) => {
            const circleCol = idx * 2 + 1; // 1-based
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={`label-${idx}`}
                style={{ gridColumn: circleCol }}
                className={`text-center text-[11px] sm:text-xs ${isCurrent ? 'text-blue-700 font-semibold' : 'text-gray-600'}`}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 컴포넌트 마운트 시 자동 시작 제거
  useEffect(() => {
    // 사이트 접속 시 자동으로 음성이 나오지 않음
    // 사용자가 "안내 시작" 버튼을 클릭해야 음성이 시작됨
    
    // 음성 합성 API 초기화
    if ('speechSynthesis' in window) {
      // voiceschanged 이벤트 리스너 추가
      const handleVoicesChanged = () => {
        console.log('음성 목록 로드 완료:', speechSynthesis.getVoices().length);
      };
      
      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      // 초기 음성 목록 확인
      if (speechSynthesis.getVoices().length > 0) {
        console.log('초기 음성 목록:', speechSynthesis.getVoices().length);
      }
      
      // 클린업 함수
      return () => {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        speechSynthesis.cancel();
      };
    }
  }, []);

  // 시작 화면에서 도움 문구를 로봇이 읽어주기 (1회)
  useEffect(() => {
    if (currentStep === 'start' && !hasSpokenStartHintRef.current) {
      hasSpokenStartHintRef.current = true;
      setTimeout(() => {
        speakMessage('안녕하세요 기억 도우미 상담 로봇입니다. 함께 이야기 나누며 도와드리겠습니다');
      }, 300);
    }
  }, [currentStep]);

  // 웨이브폼 렌더링
  const drawWaveform = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw);
      try {
        analyser.getByteTimeDomainData(dataArray);
      } catch {
        return;
      }
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.fillStyle = '#E0E7FF';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = '#1D4ED8';
      canvasCtx.beginPath();
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };
    draw();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[960px] xl:max-w-[1040px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {renderBackButton()}
        {renderHeaderRow()}
        {renderSpeechProgressBar()}
        
        {/* 시작 페이지 */}
        {currentStep === 'start' && (
          <>
          <Card className="shadow-xl border-0 bg-white relative overflow-hidden">
            <CardContent className="py-10 sm:py-12 px-6 sm:px-8 text-center space-y-4">
              {/* 제목 문구 제거 요청에 따라 숨김 */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-purple-100 rounded-full flex items-center justify-center mx-auto relative">
                {/* 로봇 아이콘 */}
                <Bot className="w-14 h-14 sm:w-20 sm:h-20 text-purple-600" />
                {/* 입모양: 아이콘 내부 중앙 하단 쪽에 위치 */}
                <div
                  className="absolute left-1/2 -translate-x-1/2" 
                  style={{ bottom: '28%', background: '#7C3AED', borderRadius: 9999, width: mouthLevel === 0 ? 6 : mouthLevel === 1 ? 10 : mouthLevel === 2 ? 14 : 10, height: mouthLevel === 0 ? 2 : mouthLevel === 1 ? 4 : mouthLevel === 2 ? 6 : 4, opacity: 0.9 }}
                />
              </div>
              <div className="bg-blue-50 border border-blue-300 text-blue-800 rounded-xl px-4 py-3 mx-auto max-w-xl text-base sm:text-lg font-semibold flex items-center justify-center gap-2">
                <span>안녕하세요 기억 도우미 상담 로봇입니다.<br /> 
                 함께 이야기 나누며 도와드리겠습니다.</span>
              </div>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button 
                  onClick={handleStartGuide}
                  aria-label="상담 시작, 음성 안내가 재생됩니다."
                  className="w-full h-14 rounded-[12px] bg-[#0052CC] hover:bg-[#0A53BE] text-white text-xl sm:text-2xl font-bold flex items-center justify-center focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#0052CC] focus-visible:outline-offset-2"
                  style={{ boxShadow: '0 8px 24px rgba(0,0,0,.06)' }}
                >
                  상담 시작
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-center">
                <Button
                  onClick={goToHome}
                  variant="outline"
                  className="w-full h-14 rounded-[12px] border-[#CC3333] text-[#CC3333] hover:bg-red-50"
                >
                  그만하기
                </Button>
              </div>
            </CardContent>
          </Card>
          </>
        )}

        {/* 안내 단계 제거됨 */}

        {/* 질문 선택 페이지 */}
        {currentStep === 'question' && (
          <QuestionSelector
            isSpeaking={isSpeaking}
            onReplay={() => speakMessage("현재 페이지에서 어떤 질문에 대해 이야기 해보고 싶은지 편하게 선택해주세요.")}
            selected={selectedQuestions}
            onToggle={handleQuestionSelect}
            onStart={handleStartConversation}
            questions={experienceQuestions.map(({ id, keyword }) => ({ id, keyword }))}
          />
        )}

        {/* 음성 녹음 페이지 */}
        {currentStep === 'recording' && (
          <Card className="shadow-xl border-0 bg-white relative">
            <CardContent className="p-12 text-center">
              <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <Mic className="w-20 h-20 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                음성 인식 중...
              </h2>
              <p className="text-lg font-bold text-gray-600 mb-8">
                편하게 말씀해주세요. 자동으로 인식됩니다.
              </p>

              {/* 마이크 상태 배너 (단일 레이아웃) */}
              <div
                className={`${(!(micActive || isRecording)) ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'} p-4 rounded-lg border text-center mb-6`}
              >
                {!(micActive || isRecording) ? (
                  <>
                    <p className="text-red-700 mb-3">
                      마이크 권한이 비활성화되어 있어요. 브라우저 설정에서 허용해 주세요.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button onClick={handleEnterRecordingStep} className="bg-red-600 hover:bg-red-700 text-white">
                        마이크 권한 허용
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-blue-700 font-medium">🎤 마이크가 활성화되어 있습니다</p>
                    <p className="text-blue-600 text-sm mt-1">말씀하시면 자동으로 인식됩니다</p>
                  </>
                )}
              </div>
              

              {/* 웨이브폼 캔버스 */}
              <div className="mt-6">
                <canvas ref={canvasRef} width={800} height={180} className="w-full rounded-lg border-2 border-indigo-300 bg-indigo-50" />
              </div>
              
              {/* 다시 듣기 버튼 */}
              <Button 
                onClick={() => {
                  const selectedQuestion = experienceQuestions.find(q => q.id === selectedQuestions[currentQuestionIndex]);
                  if (selectedQuestion) {
                    speakMessage(selectedQuestion.question);
                  }
                }}
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300 hover:border-red-400 mt-6"
                disabled={isSpeaking}
              >
                <Volume2 className="w-4 h-4 mr-2" />
                질문 다시 듣기
              </Button>

              {/* 액션 버튼 - 통일화 */}
              <div className="mt-6 flex flex-col gap-3">
                <Button 
                  onClick={analyzeNowFromRecording}
                  className="w-full h-14 rounded-[12px] bg-[#0052CC] hover:bg-[#0A53BE] text-white text-xl font-bold"
                  disabled={isSpeaking}
                >
                  분석하기
                </Button>
                <Button
                  onClick={goToHome}
                  variant="outline"
                  className="w-full h-14 rounded-[12px] border-[#CC3333] text-[#CC3333] hover:bg-red-50"
                >
                  그만하기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 음성 인식 결과 및 분석 시작 페이지 */}
        {currentStep === 'processing' && (
          <Card className="shadow-xl border-0 bg-white relative">
            <CardContent className="p-12 text-center">
              {isAnalyzing ? (
                <>
                  <div className="w-32 h-32 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-spin">
                    <Bot className="w-20 h-20 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    분석중입니다~
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">잠시만 기다려주세요...</p>
                </>
              ) : (
                <>
                  <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Bot className="w-20 h-20 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    음성 인식 완료
                  </h2>
                </>
              )}

              {/* 간단한 인식 상태 아이콘 */}
              {!isAnalyzing && (
                <div className="flex items-center justify-center mb-6 text-sm">
                  {recognizedText && recognizedText.trim().length > 0 ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span>음성 인식됨</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span>음성이 인식되지 않았어요. 다시 한 번 확인해주세요.</span>
                    </div>
                  )}
                </div>
              )}

              {!isAnalyzing && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                  <p className="text-blue-800 font-medium">
                    진행 상황: {currentQuestionIndex + 1} / {selectedQuestions.length}
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    {currentQuestionIndex < selectedQuestions.length - 1 ? '다음 질문으로 진행하거나 분석을 시작할 수 있습니다.' : '모든 질문이 완료되었습니다. 분석을 시작할 수 있습니다.'}
                  </p>
                </div>
              )}

              {!isAnalyzing && (
                <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 mb-6 text-left">
                  <h3 className="text-lg font-bold text-blue-800 mb-3">🎤 인식된 음성</h3>
                  <div className="text-blue-900 text-lg leading-relaxed whitespace-pre-wrap break-words p-4 bg-white/60 rounded-lg">
                    {userResponse}
                  </div>
                </div>
              )}

              {/* 액션 버튼 - 통일화 */}
              {!isAnalyzing && (
                <div className="flex flex-col items-center justify-center gap-3 mb-6">
                  <Button 
                    onClick={handleStartAnalysis}
                    className="w-full h-14 rounded-[12px] bg-[#0052CC] hover:bg-[#0A53BE] text-white text-xl font-bold"
                  >
                    분석 시작하기
                  </Button>
                  <Button
                    onClick={goToHome}
                    variant="outline"
                    className="w-full h-14 rounded-[12px] border-[#CC3333] text-[#CC3333] hover:bg-red-50"
                  >
                    그만하기
                  </Button>
                </div>
              )}

              {/* 간단한 재인식 버튼 (필요 시) */}
              {!isAnalyzing && (!recognizedText || recognizedText.trim().length === 0) && (
                <div className="mb-6">
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

        {/* 분석 결과 페이지 */}
        {currentStep === 'result' && (
          <Card className="shadow-xl border-0 bg-white relative">
            <CardContent className="p-12 text-center">
              <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <Bot className="w-20 h-20 text-green-600" />
              </div>
             
              
              {/* 분석 결과 */}
              <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200 mb-8">
                <h3 className="text-lg font-bold text-green-800 mb-3">🤖 AI 분석 결과</h3>
                <p className="text-green-900 text-lg leading-relaxed whitespace-pre-line">
                  {analysisResult}
                </p>
                </div>
              
              {/* 결과 액션: PDF 다운로드 / 다시 검사하기 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <Button 
                  onClick={handleDownloadPDF}
                  className="h-14 rounded-[12px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-lg font-bold"
                  disabled={!analysisResult}
                >
                  PDF 다운로드
                </Button>
                <Button 
                  onClick={handleRetest}
                  variant="outline"
                  className="h-14 rounded-[12px] border-[#2563eb] text-[#2563eb] hover:bg-blue-50"
                >
                  다시 검사하기
                </Button>
              </div>

              
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}




