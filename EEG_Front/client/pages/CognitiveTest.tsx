import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, Link } from "react-router-dom";
import { saveCognitiveScore } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { 
  Brain, 
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  AlertCircle,
  Volume2,
  VolumeX,
  RotateCcw,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// OpenAI API를 사용한 장소 판별 함수
const checkPlaceWithAI = async (word: string): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:8000/check_place', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('장소 판별 결과:', result);
    
    return result.is_place;
  } catch (error) {
    console.error('장소 판별 API 호출 오류:', error);
    throw error;
  }
};

// 장소 판별 테스트 함수 (사용자가 원할 때 호출)
const testPlaceWithAI = async (word: string) => {
  try {
    console.log(`🧠 AI 장소 판별 테스트: "${word}"`);
    const isPlace = await checkPlaceWithAI(word);
    console.log(`결과: "${word}"는 ${isPlace ? '장소입니다' : '장소가 아닙니다'}`);
    return isPlace;
  } catch (error) {
    console.error('AI 장소 판별 실패:', error);
    return false;
  }
};

export default function CognitiveTest() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: any }>({});
  const [scores, setScores] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [trailMakingSequence, setTrailMakingSequence] = useState<string[]>([]);
  const [trailMakingConnections, setTrailMakingConnections] = useState<any[]>([]);
  const [memoryTimeLeft, setMemoryTimeLeft] = useState(10);
  const [isMemoryTimerRunning, setIsMemoryTimerRunning] = useState(false);
  const [memoryPhase, setMemoryPhase] = useState<'instruction' | 'showing' | 'input'>('instruction');
  const [attentionPhase, setAttentionPhase] = useState<'sequence' | 'calculation'>('sequence');
  const [sequenceNumbers, setSequenceNumbers] = useState<string[]>([]);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  // TTS 관련 상태
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);

  // 테스트 모드 확인
  const testMode = sessionStorage.getItem('testMode') || 'voice';
  const isVoiceMode = testMode === 'voice';

  // 선택된 검사 확인
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [currentAnimalIndex, setCurrentAnimalIndex] = useState(0);
  
  // 유창성 테스트 관련 상태
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{[key: string]: boolean}>({});
  const [fluencyTotalScore, setFluencyTotalScore] = useState(0);
  const [showFluencyResults, setShowFluencyResults] = useState(false);
  const [fluencyTimeLeft, setFluencyTimeLeft] = useState(120); // 2분 제한시간
  const [isFluencyTimerRunning, setIsFluencyTimerRunning] = useState(false);

  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [testEndTime, setTestEndTime] = useState<Date | null>(null);

  // 페이지 로드 시 선택된 검사 정보 확인
  useEffect(() => {
    const savedTests = sessionStorage.getItem('selectedTests');
    if (savedTests) {
      try {
        const tests = JSON.parse(savedTests);
        setSelectedTests(tests);
        if (tests.length > 0) {
          setCurrentTest(tests[0]);
        }
      } catch (error) {
        console.error('선택된 검사 정보를 읽을 수 없습니다:', error);
        // 기본값으로 MOCA 설정
        setSelectedTests(['MOCA']);
        setCurrentTest('MOCA');
      }
    } else {
      // 선택된 검사가 없으면 기본값으로 MOCA 설정
      setSelectedTests(['MOCA']);
      setCurrentTest('MOCA');
    }
  }, []);

  // 유창성 테스트 타이머 효과
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isFluencyTimerRunning && fluencyTimeLeft > 0) {
      console.log('⏰ 타이머 시작! 남은 시간:', fluencyTimeLeft);
      interval = setInterval(() => {
        setFluencyTimeLeft(prev => {
          if (prev <= 1) {
            console.log('⏰ 시간 종료! 입력칸 잠금');
            setIsFluencyTimerRunning(false);
            // 시간 종료 시 입력칸만 잠금, 자동 진행 없음
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isFluencyTimerRunning, fluencyTimeLeft, currentQuestion]);



  // ㄱ 초성 판별 함수
  const startsWithㄱ = (word: string): boolean => {
    if (!word || word.length === 0) return false;
    const firstChar = word.charAt(0);
    if ('가' <= firstChar && firstChar <= '힣') {
      const 초성List = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ", "ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
      const code = firstChar.charCodeAt(0) - '가'.charCodeAt(0);
      const 초성 = 초성List[Math.floor(code / 588)];
      return 초성 === "ㄱ";
    } else {
      return firstChar === 'ㄱ';
    }
  };

  // 유효한 ㄱ 단어 목록
  const validGWords = [
    // '가', '가게', '가격', '가구', '가까이', '가나다', '가난', '가능', '가다', '가득', '가족', '가방',
    // '가라', '가락', '가래', '가로', '가루', '가르다', '가르침', '가리다', '가리키다', '가마', '가위',
    // '가발', '가속', '가압', '가열', '가입', '가입자', '가공', '가동', '가설', '가속도', '가속화', '가압기', '가위질', '가위손', '가정식', '가사노동',
    // '가마니', '가상현실', '가열기', '가옥', '가이드', '가팔라', '갈등', '갈대', '개강', '개편', '객관', '거래', '건물', '검사관', '게시판', '결과물', '고립', '고유', '공연', '공원', '과학', '관광', '광고판', '구조', '구석', '구입', '국물', '군중', '굴착', '깃발',
    // '김', '김치', '김치찌개', '김치볶음', '김치무침', '김치국', '김치찜', '김치탕', '김치구이', '김치무침', '김밥',
    // '깊', '깊다', '깊어', '깊은', '깊게', '깊어', '깊었', '깊자', '깊겠', '깊셨',
    // '국밥'
  ];



  // 단어 검증 함수 (API + 내장 목록 혼합 사용)
  const isRealWord = async (word: string): Promise<boolean> => {
    console.log(`🔍 단어 검증 시작: "${word}"`);
    
    // ㄱ으로 시작하는지 확인
    if (!startsWithㄱ(word)) {
      console.log(`❌ ㄱ으로 시작하지 않음: "${word}"`);
      return false;
    }
    
    try {
      // 먼저 내장된 목록에서 확인 (빠른 검증)
      if (validGWords.includes(word)) {
        console.log(`✅ 내장 목록에서 발견: "${word}"`);
        return true;
      }
      
      // 내장 목록에 없으면 API 호출 시도
      console.log(`🔍 API 호출 시도: "${word}"`);
      const response = await fetch('http://localhost:8090/api/validate-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: word })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📋 API 응답: "${word}" -> ${data.isValid ? '유효' : '무효'}`);
        return data.isValid;
      } else {
        console.log(`❌ API 호출 실패, 내장 목록으로 대체: "${word}"`);
        // API 실패 시 내장 목록으로 대체
        return validGWords.includes(word);
      }
    } catch (error) {
      console.log(`❌ API 오류, 내장 목록으로 대체: "${word}"`);
      // API 오류 시 내장 목록으로 대체
      return validGWords.includes(word);
    }
  };

  // 유창성 테스트 단어 검증 함수
  const validateWords = async () => {
    setIsValidating(true);
    const inputText = answers[currentQuestion] || '';
    const words = inputText.split(',').map(w => w.trim()).filter(w => w.length > 0);
    const results: {[key: string]: boolean} = {};
    let score = 0;

    console.log("=== 단어 검증 시작 ===");
    
    for (const word of words) {
      const isValid = await isRealWord(word);
      results[word] = isValid;
      if (isValid) score++;
      
      console.log(`${isValid ? '✅' : '❌'} ${word}: ${isValid ? 1 : 0}점`);
    }

    console.log(`📊 총점: ${score}/${Object.keys(results).length}점`);
    
    setValidationResults(results);
    setFluencyTotalScore(score);
    setShowFluencyResults(true);
    setIsValidating(false);
    
    // 검증 결과를 답변에 저장하여 점수 계산에 사용
    const validatedAnswer = {
      text: inputText,
      validationResults: results,
      validationScore: score,
      isValidated: true
    };
    
    // 유창성 테스트에서는 handleAnswer 대신 직접 상태 업데이트
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: validatedAnswer
    }));
    
    console.log('검증된 답변 저장:', validatedAnswer);
  };

  const questions = useMemo(() => [
    {
      id: 1,
      category: "시공간/집행기능",
      title: "Trail Making Test",
      maxPoints: 2,
      type: "trail-making"
    },
    {
      id: 2,
      category: "이름대기",
      title: "동물 이름 말하기",
      maxPoints: 3,
      type: "naming"
    },
    {
      id: 3,
      category: "기억력",
      title: "단어 기억하기",
      maxPoints: 5,
      type: "memory"
    },
    {
      id: 4,
      category: "주의력",
      title: "주의력 테스트",
      maxPoints: 5,
      type: "attention"
    },
    {
      id: 5,
      category: "언어",
      title: "유창성 테스트",
      maxPoints: 1,
      type: "fluency"
    },
    {
      id: 6,
      category: "추상력",
      title: "공통점 찾기",
      maxPoints: 2,
      type: "abstraction"
    },
    {
      id: 7,
      category: "지남력",
      title: "지남력 테스트",
      maxPoints: 6,
      type: "orientation"
    }
  ], []);

  // 문제 변경 시 유창성 테스트 상태 초기화
  useEffect(() => {
    console.log('🔄 문제 변경 감지:', currentQuestion, questions[currentQuestion]?.type);
    
    if (questions[currentQuestion]?.type === 'fluency') {
      console.log('🧠 유창성 테스트 상태 초기화');
      setShowFluencyResults(false);
      setValidationResults({});
      setFluencyTotalScore(0);
      setFluencyTimeLeft(120);
      setIsFluencyTimerRunning(false);
    }
  }, [currentQuestion]);

  const currentQuestionData = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

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

  // 문제 음성 안내 함수
  const speakQuestion = () => {
    const currentQ = questions[currentQuestion];
    let textToSpeak = "";
    
    // 각 문제마다 처음부터 음성 안내
    if (currentQ.type === 'trail-making') {
      textToSpeak = "숫자와 글자를 순서대로 연결하세요. 선을 따라 그리세요.";
    } else if (currentQ.type === 'memory') {
      textToSpeak = "5개 단어를 기억하고 회상하세요. 기억하세요.";
    } else if (currentQ.type === 'attention') {
      textToSpeak = "숫자 따라하기와 계산하기. 주의 깊게 보세요.";
    } else if (currentQ.type === 'fluency') {
      textToSpeak = "ㄱ으로 시작하는 단어를 많이 말하기. 빠르게 말해보세요.";
    } else if (currentQ.type === 'abstraction') {
      textToSpeak = "두 단어의 공통점을 찾아보세요.";
    } else if (currentQ.type === 'orientation') {
      textToSpeak = "현재 상황에 대한 질문에 답하세요.";
    } else if (currentQ.type === 'naming') {
      textToSpeak = "제시된 동물들의 이름을 입력하세요.";
    }
    
    speakText(textToSpeak);
  };

  // 문제 변경 시 자동 음성 안내
  useEffect(() => {
    if (isTTSEnabled && !showResults) {
      const currentQ = questions[currentQuestion];
      let textToSpeak = "";
      
      // 각 문제마다 처음부터 음성 안내
      if (currentQ.type === 'trail-making') {
        textToSpeak = "숫자와 글자를 순서대로 연결하세요. 선을 따라 그리세요.";
      } else if (currentQ.type === 'memory') {
        textToSpeak = "5개 단어를 기억하고 회상하세요. 기억하세요.";
      } else if (currentQ.type === 'attention') {
        textToSpeak = "숫자 따라하기와 계산하기. 주의 깊게 보세요.";
      } else if (currentQ.type === 'fluency') {
        textToSpeak = "ㄱ으로 시작하는 단어를 많이 말하기. 빠르게 말해보세요.";
      } else if (currentQ.type === 'abstraction') {
        textToSpeak = "두 단어의 공통점을 찾아보세요.";
      } else if (currentQ.type === 'orientation') {
        textToSpeak = "현재 상황에 대한 질문에 답하세요.";
      } else if (currentQ.type === 'naming') {
        textToSpeak = "제시된 동물들의 이름을 입력하세요.";
      }
      
      // 약간의 지연 후 음성 안내 (사용자가 준비할 시간)
      const timer = setTimeout(() => {
        speakText(textToSpeak);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, isTTSEnabled, showResults]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (memoryPhase === 'showing' && isMemoryTimerRunning && memoryTimeLeft > 0) {
      interval = setInterval(() => {
        setMemoryTimeLeft((prev) => {
          if (prev <= 1) {
            setIsMemoryTimerRunning(false);
            setMemoryPhase('input');
            handleAnswer({ ...answers[currentQuestion], showInput: true });
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [memoryPhase, isMemoryTimerRunning, memoryTimeLeft, currentQuestion, answers]);

  // 주의력 테스트 자동 진행
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isShowingSequence && currentSequenceIndex < sequenceNumbers.length) {
      interval = setInterval(() => {
        setCurrentSequenceIndex(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isShowingSequence, currentSequenceIndex, sequenceNumbers.length]);

  // 문제가 변경될 때 주의력 테스트와 기억력 테스트 상태 초기화
  useEffect(() => {
    if (questions[currentQuestion]?.type !== 'attention') {
      setIsShowingSequence(false);
      setCurrentSequenceIndex(0);
      setAttentionPhase('sequence');
    }
    if (questions[currentQuestion]?.type !== 'memory') {
      setMemoryPhase('instruction');
      setIsMemoryTimerRunning(false);
      setMemoryTimeLeft(10);
    }
  }, [currentQuestion]);

  const handleAnswer = async (answer: any) => {
    console.log(`handleAnswer 호출: 문제 ${currentQuestion + 1}`);
    console.log('이전 답변:', answers[currentQuestion]);
    console.log('새로운 답변:', answer);
    
    setAnswers(prev => ({ ...prev, [currentQuestion]: answer }));
    setAnsweredQuestions(prev => new Set([...prev, currentQuestion]));
    
    console.log('답변 저장 완료');
  };

  const handleScore = (score: number) => {
    console.log(`handleScore 호출: 문제 ${currentQuestion + 1}, 점수 ${score}`);
    setScores(prev => ({ ...prev, [currentQuestion]: score }));
    console.log('scores 상태 업데이트 완료');
  };

  const handleNext = async () => {
    // 현재 문제의 점수 자동 계산
    const currentQuestionData = questions[currentQuestion];
    let currentScore = 0;
    
    console.log(`=== 문제 ${currentQuestion + 1} (${currentQuestionData.type}) 점수 계산 ===`);
    console.log('현재 답변:', answers[currentQuestion]);
    
    switch (currentQuestionData.type) {
      case 'trail-making':
        currentScore = calculateTrailMakingScore(answers[currentQuestion]);
        break;
      case 'naming':
        currentScore = calculateNamingScore(answers[currentQuestion]);
        break;
      case 'memory':
        currentScore = calculateMemoryScore(answers[currentQuestion]);
        break;
      case 'attention':
        // 주의력 테스트 점수 계산 (handleScore에서 이미 계산했지만 안전하게 다시 계산)
        currentScore = calculateAttentionScore(answers[currentQuestion]);
        break;
      case 'fluency':
        currentScore = calculateFluencyScore(answers[currentQuestion]);
        break;
      case 'abstraction':
        currentScore = calculateAbstractionScore(answers[currentQuestion]);
        break;
      case 'orientation':
        currentScore = await calculateOrientationScore(answers[currentQuestion]);
        break;
      default:
        currentScore = 0;
    }
    
    // 계산된 점수를 scores에 저장
    console.log(`문제 ${currentQuestion + 1} 최종 점수:`, currentScore);
    setScores(prev => ({ ...prev, [currentQuestion]: currentScore }));
    console.log('=== 점수 계산 완료 ===');
    
    if (currentQuestion < questions.length - 1) {
      // 현재 음성 정지
      if (isTTSEnabled) {
        stopSpeaking();
      }
      
      // 주의력 테스트 상태 초기화
      if (questions[currentQuestion].type === 'attention') {
        setIsShowingSequence(false);
        setCurrentSequenceIndex(0);
        setAttentionPhase('sequence');
      }
      
      setCurrentQuestion(prev => prev + 1);
    } else {
      if (isTTSEnabled) {
        speakText("모든 문제를 완료했습니다. 결과를 확인해주세요.");
      }
      setShowResults(true);
    }
  };

  const handleFinishTest = () => {
    const totalScore = getTotalScore();
    const maxScore = getMaxScore();
    const percentage = Math.round((totalScore / maxScore) * 100);
    
    // 현재 검사에 따라 다르게 처리
    if (currentTest === 'MOCA') {
      // MOCA 검사 완료 시
      if (isLoggedIn) {
        try {
          const sessionIdxStr = sessionStorage.getItem('currentSessionIdx');
          const sessionIdx = sessionIdxStr ? parseInt(sessionIdxStr) : null;
          if (sessionIdx) {
            saveCognitiveScore(sessionIdx, 'MOCA', totalScore).catch(() => {});
          }
        } catch {}
      }
      
      // 다음 검사가 있으면 해당 검사로 이동, 없으면 결과 페이지로
      if (selectedTests.includes('MMSE')) {
        // MMSE 검사 페이지로 이동 (MOCA 점수와 함께)
        navigate(`/mmse?mocaScore=${totalScore}&mocaMaxScore=30&mocaPercentage=${percentage}`);
      } else {
        // 모든 검사 완료, 결과 페이지로 이동 (MOCA 점수만 전달)
        navigate(`/results?mocaScore=${totalScore}&mocaMaxScore=30&mocaPercentage=${percentage}`);
      }
    } else {
      // MMSE 검사 완료 시
      if (isLoggedIn) {
        try {
          const sessionIdxStr = sessionStorage.getItem('currentSessionIdx');
          const sessionIdx = sessionIdxStr ? parseInt(sessionIdxStr) : null;
          if (sessionIdx) {
            saveCognitiveScore(sessionIdx, 'MMSE', totalScore).catch(() => {});
          }
        } catch {}
      }
      
      // 모든 검사 완료, 결과 페이지로 이동 (MMSE 점수만 전달)
      navigate(`/results?mmseScore=${totalScore}&mmseMaxScore=30&mmsePercentage=${percentage}`);
    }
  };

  const handleTrailMakingClick = (value: string, type: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const parentRect = element.parentElement?.getBoundingClientRect();
    if (!parentRect) return;
    const x = rect.left - parentRect.left + rect.width / 2;
    const y = rect.top - parentRect.top + rect.height / 2;
    const newSequence = [...trailMakingSequence, value];
    setTrailMakingSequence(newSequence);
    if (newSequence.length > 1) {
      const prevElement = document.querySelector(`[data-value="${newSequence[newSequence.length - 2]}"]`) as HTMLElement;
      if (prevElement) {
        const prevRect = prevElement.getBoundingClientRect();
        const prevX = prevRect.left - parentRect.left + prevRect.width / 2;
        const prevY = prevRect.top - parentRect.top + prevRect.height / 2;
        const newConnection = { x1: prevX, y1: prevY, x2: x, y2: y };
        setTrailMakingConnections([...trailMakingConnections, newConnection]);
      }
    }
    const sequenceString = newSequence.join(' → ');
    handleAnswer({ 
      sequence: sequenceString, 
      connections: [...trailMakingConnections, ...(newSequence.length > 1 ? [{
        x1: trailMakingConnections.length > 0 ? trailMakingConnections[trailMakingConnections.length - 1].x2 : 0,
        y1: trailMakingConnections.length > 0 ? trailMakingConnections[trailMakingConnections.length - 1].y2 : 0,
        x2: x,
        y2: y
      }] : [])]
    });
  };

  const resetTrailMaking = () => {
    setTrailMakingSequence([]);
    setTrailMakingConnections([]);
    handleAnswer({ sequence: '', connections: [] });
  };

  // 다음 빈칸을 찾는 함수
  const getNextBlank = (currentAnswers: any) => {
    for (let i = 1; i <= 10; i++) {
      const blankKey = `blank${i}`;
      if (!currentAnswers[blankKey]) {
        return blankKey;
      }
    }
    return null; // 모든 빈칸이 채워짐
  };

  const renderTrailMakingTest = () => (
    <div className="space-y-6">
      {/* Trail Making Test Image */}
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
        <div className="text-center">
          <img 
            src="/images/trail-making-test.png" 
            alt="Trail Making Test" 
            className="mx-auto max-w-full h-auto rounded-lg shadow-sm"
          />
        </div>
      </div>
      {/* Fill in the blanks with button selection */}
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
        <Label className="text-xs sm:text-sm font-medium text-blue-800 mb-3 sm:mb-4 block text-center">숫자와 글자를 순서대로 연결하세요:</Label>
        
        {/* 답변 표시 영역 */}
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
          <div className="text-center mb-3">
            <span className="text-sm text-blue-600 font-medium">선택된 순서:</span>
          </div>
          <div className="grid grid-cols-5 gap-1 sm:gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-10 h-8 sm:w-12 sm:h-10 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold text-blue-700">
                  {answers[currentQuestion]?.[`blank${index}`] || '?'}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 숫자와 글자 버튼들을 가로로 배치 */}
        <div className="mb-4 sm:mb-6">
          <h4 className="text-xs sm:text-sm font-medium text-blue-800 mb-2 sm:mb-3 text-center">숫자와 글자 선택:</h4>
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5].map((num) => (
              <Button
                key={`num-${num}`}
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentAnswers = answers[currentQuestion] || {};
                  const nextBlank = getNextBlank(currentAnswers);
                  if (nextBlank) {
                    handleAnswer({ ...currentAnswers, [nextBlank]: num.toString() });
                  }
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-lg font-bold border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                disabled={!getNextBlank(answers[currentQuestion] || {})}
              >
                {num}
              </Button>
            ))}
            {['가', '나', '다', '라', '마'].map((letter) => (
              <Button
                key={`letter-${letter}`}
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentAnswers = answers[currentQuestion] || {};
                  const nextBlank = getNextBlank(currentAnswers);
                  if (nextBlank) {
                    handleAnswer({ ...currentAnswers, [nextBlank]: letter });
                  }
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-lg font-bold border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                disabled={!getNextBlank(answers[currentQuestion] || {})}
              >
                {letter}
              </Button>
            ))}
          </div>
        </div>
        
        {/* 답변 초기화 버튼 */}
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleAnswer({});
            }}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            답변 초기화
          </Button>
        </div>
      </div>
      <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm text-blue-700">빈칸을 모두 채우고 다음을 누르면 자동 채점됩니다</p>
      </div>
    </div>
  );

  const calculateTrailMakingScore = (answer: any) => {
    if (!answer) return 0;
    const correctAnswers = { blank1: '1', blank2: '가', blank3: '2', blank4: '나', blank5: '3', blank6: '다', blank7: '4', blank8: '라', blank9: '5', blank10: '마' };
    let correctCount = 0;
    
    console.log('Trail Making Test 답변:', answer);
    console.log('정답:', correctAnswers);
    
    Object.keys(correctAnswers).forEach(key => { 
      const isCorrect = answer[key] === correctAnswers[key];
      console.log(`${key}: 사용자답변=${answer[key]}, 정답=${correctAnswers[key]}, 정답여부=${isCorrect}`);
      if (isCorrect) correctCount++; 
    });
    
    console.log('총 정답 개수:', correctCount);
    const score = correctCount === 10 ? 2 : (correctCount >= 7 ? 1 : 0);
    console.log('최종 점수:', score);
    
    return score;
  };

  const renderNamingTest = () => {
    const animals = [
      {
        id: 'tiger',
        image: '/images/tiger.PNG',
        alt: 'Tiger',
        options: ['호랑이', '기린', '사자', '코끼리', '토끼', '강아지'],
        correct: '사자'
      },
      {
        id: 'bat',
        image: '/images/bat.PNG',
        alt: 'Bat',
        options: ['고양이', '쥐', '박쥐', '햄스터', '다람쥐', '토끼'],
        correct: '박쥐'
      },
      {
        id: 'camel',
        image: '/images/camel.PNG',
        alt: 'Camel',
        options: ['말', '소', '양', '낙타', '염소', '당나귀'],
        correct: '낙타'
      }
    ];

    const currentAnimal = animals[currentAnimalIndex];

    return (
      <div className="space-y-6">
        <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">({currentAnimalIndex + 1}/3)</h3>
          
          {/* 동물 슬라이드 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <img src={currentAnimal.image} alt={currentAnimal.alt} className="w-32 h-32 object-contain rounded-lg shadow-md" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-medium text-blue-800 mb-3">이 동물의 이름은?</h4>
                
                {/* 답변 표시 */}
                <div className="mb-4">
                  <div className="w-full h-12 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-lg font-bold text-blue-700">
                    {answers[currentQuestion]?.[currentAnimal.id] || '선택하세요'}
                  </div>
                </div>
                
                {/* 동물 이름 선택 버튼들 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {currentAnimal.options.map((name) => (
                    <Button
                      key={`${currentAnimal.id}-${name}`}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleAnswer({ ...answers[currentQuestion], [currentAnimal.id]: name });
                      }}
                      className={`h-10 text-sm font-medium transition-all duration-200 ${
                        answers[currentQuestion]?.[currentAnimal.id] === name
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                      }`}
                    >
                      {name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* 슬라이드 네비게이션 */}
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentAnimalIndex(Math.max(0, currentAnimalIndex - 1))}
              disabled={currentAnimalIndex === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              이전
            </Button>
            
            <div className="flex gap-2">
              {animals.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentAnimalIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentAnimalIndex(Math.min(animals.length - 1, currentAnimalIndex + 1))}
              disabled={currentAnimalIndex === animals.length - 1}
              className="flex items-center gap-2"
            >
              다음
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          

        </div>
        <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-blue-700">모든 동물의 이름을 선택하고 다음을 누르면 자동 채점됩니다</p>
        </div>
      </div>
    );
  };

  const calculateNamingScore = (answer: any) => {
    if (!answer) return 0;
    let score = 0;
    
    console.log('동물 이름 말하기 답변:', answer);
    
    // 정확한 답변 체크 (정확히 일치해야 함)
    const tigerCorrect = answer.tiger === '사자';
    const batCorrect = answer.bat === '박쥐';
    const camelCorrect = answer.camel === '낙타';
    
    console.log(`사자: 사용자답변=${answer.tiger}, 정답=사자, 정답여부=${tigerCorrect}`);
    console.log(`박쥐: 사용자답변=${answer.bat}, 정답=박쥐, 정답여부=${batCorrect}`);
    console.log(`낙타: 사용자답변=${answer.camel}, 정답=낙타, 정답여부=${camelCorrect}`);
    
    if (tigerCorrect) score++;
    if (batCorrect) score++;
    if (camelCorrect) score++;
    
    console.log('최종 점수:', score);
    
    return score;
  };

  const renderMemoryTest = () => {
    return (
      <div className="space-y-4">
        {memoryPhase === 'instruction' && (
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-base md:text-lg font-medium text-blue-800 mb-3">
              잠시 후 5개의 단어가 나타납니다.<br />
              단어들을 잘 기억해두세요.
            </p>
            <p className="text-xs text-blue-600">준비가 되면 시작하세요</p>
            <Button 
              onClick={() => {
                setMemoryPhase('showing');
                setIsMemoryTimerRunning(true);
                setMemoryTimeLeft(10);
              }} 
              className="w-full mt-3"
            >
              시작하기
            </Button>
          </div>
        )}
        {memoryPhase === 'showing' && (
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-blue-700 mb-2">다음 5개 단어를 기억하세요:</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
              {['사과', '책상', '자동차', '바다', '꽃'].map((word, index) => (
                <div key={index} className="p-2 bg-white rounded border font-bold">
                  {word}
                </div>
              ))}
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-3">{memoryTimeLeft}초 남음</div>
          </div>
        )}
        {memoryPhase === 'input' && (
          <div className="space-y-6">
            <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">기억한 단어들을 선택하세요:</h3>
              
              {/* 답변 표시 영역 */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="text-center">
                  <span className="text-blue-600 font-bold text-lg mb-3 block">선택된 단어들:</span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {answers[currentQuestion]?.words?.split(',').filter(word => word.trim()).map((word, index) => (
                      <div key={index} className="px-3 py-2 bg-white text-blue-700 border-2 border-blue-300 rounded-lg font-semibold">
                        {word.trim()}
                      </div>
                    ))}
                    {(!answers[currentQuestion]?.words || answers[currentQuestion]?.words.split(',').filter(word => word.trim()).length === 0) && (
                      <span className="text-gray-500 italic">단어를 선택하세요</span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-blue-600">
                    선택된 단어: {answers[currentQuestion]?.words?.split(',').filter(word => word.trim()).length || 0}개 / 5개
                  </div>
                </div>
              </div>
              
              {/* 단어 선택 버튼들 */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-blue-800 mb-3 text-center">기억한 단어를 선택하세요 (최대 5개):</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {['컴퓨터', '사과', '전화', '책상', '의자', '자동차', '창문', '바다', '문', '꽃'].map((word) => (
                    <Button
                      key={`memory-${word}`}
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        const currentAnswers = answers[currentQuestion] || {};
                        const currentWords = currentAnswers.words ? currentAnswers.words.split(',').filter(w => w.trim()) : [];
                        
                        if (currentWords.includes(word)) {
                          // 이미 선택된 단어면 제거
                          const newWords = currentWords.filter(w => w !== word);
                          handleAnswer({ ...currentAnswers, words: newWords.join(', ') });
                        } else if (currentWords.length < 5) {
                          // 5개 미만이면 추가 (중복 방지)
                          if (!currentWords.includes(word)) {
                            const newWords = [...currentWords, word];
                            handleAnswer({ ...currentAnswers, words: newWords.join(', ') });
                          }
                        }
                      }}
                      className="h-16 text-base font-medium transition-all duration-200 bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400"

                    >
                      {word}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* 답변 초기화 버튼 */}
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleAnswer({ ...answers[currentQuestion], words: '' });
                  }}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  답변 초기화
                </Button>
              </div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-blue-700">기억한 단어를 선택하고 다음을 누르면 자동 채점됩니다</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const calculateMemoryScore = (answer: any) => {
    if (!answer) return 0;
    const inputWords = answer.words?.split(',').map(w => w.trim()) || [];
    const correctWords = ['사과', '책상', '자동차', '바다', '꽃'];
    let score = 0;
    
    console.log('기억력 테스트 답변:', answer);
    console.log('입력된 단어들:', inputWords);
    console.log('정답 단어들:', correctWords);
    
    inputWords.forEach(word => { 
      const isCorrect = correctWords.includes(word);
      console.log(`단어 "${word}": 정답여부=${isCorrect}`);
      if (isCorrect) score++; 
    });
    
    console.log('최종 점수:', score);
    return Math.min(score, 5);
  };

  const renderAttentionTest = () => (
    <div className="space-y-4">
      {attentionPhase === 'sequence' && (
        <>
          {!isShowingSequence ? (
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                              <p className="text-sm text-blue-700 mb-2">숫자를 하나씩 보여드릴게요. 기억하세요</p>
                <p className="text-base md:text-lg font-medium text-blue-800 mb-3">잠시 후 숫자가 나타납니다</p>
              <Button onClick={() => { 
                setIsShowingSequence(true); 
                setSequenceNumbers(['2', '1', '8', '4', '5']); 
                setCurrentSequenceIndex(0); 
              }} className="w-full">
                시작하기
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                {currentSequenceIndex < sequenceNumbers.length ? (
                  <>
                    <p className="text-sm text-blue-700 mb-2">숫자를 기억하세요:</p>
                    <div className="text-6xl font-bold text-blue-600 my-6">{sequenceNumbers[currentSequenceIndex]}</div>
                  </>
                ) : (
                  <div className="text-base md:text-lg font-medium text-blue-800 my-6">이제 기억한 숫자를 순서대로 입력해주세요</div>
                )}
              </div>
              {currentSequenceIndex >= sequenceNumbers.length && (
                <div className="space-y-4">
                  {/* 답변 표시 영역 */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <span className="text-blue-600 font-bold text-lg mb-3 block">기억한 숫자:</span>
                      <div className="flex flex-wrap justify-center gap-2">
                        {answers[currentQuestion]?.sequence?.split('').map((digit, index) => (
                          <div key={index} className="w-12 h-12 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-xl font-bold text-blue-700">
                            {digit}
                          </div>
                        ))}
                        {(!answers[currentQuestion]?.sequence || answers[currentQuestion]?.sequence.length === 0) && (
                          <span className="text-gray-500 italic">숫자를 선택하세요</span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-blue-600">
                        입력된 숫자: {answers[currentQuestion]?.sequence?.length || 0}개 / 5개
                      </div>
                    </div>
                  </div>
                  
                  {/* 숫자 선택 버튼들 */}
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-blue-800 mb-3">숫자를 선택하세요 (최대 5개):</h4>
                    <div className="grid grid-cols-5 gap-3 mb-4">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <Button
                          key={`num-${num}`}
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            const currentAnswers = answers[currentQuestion] || {};
                            const currentSequence = currentAnswers.sequence || '';
                            
                            console.log(`숫자 ${num} 클릭: 현재 순서=${currentSequence}`);
                            
                            if (currentSequence.length < 5) {
                              const newSequence = currentSequence + num.toString();
                              console.log(`새로운 순서: ${newSequence}`);
                              handleAnswer({ ...currentAnswers, sequence: newSequence });
                            }
                          }}
                          className="w-16 h-16 text-xl font-bold bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                          disabled={answers[currentQuestion]?.sequence?.length >= 5}
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                    
                    {/* 답변 초기화 버튼 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleAnswer({ ...answers[currentQuestion], sequence: '' });
                      }}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      답변 초기화
                    </Button>
                  </div>
                </div>
              )}

            </>
          )}
        </>
      )}
      {attentionPhase === 'calculation' && (
        <>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-blue-700 mb-2">숫자 순서 입력 완료</p>
            <p className="text-base md:text-lg font-medium text-blue-800 mb-2">입력된 숫자 순서를 확인하세요</p>
            <p className="text-xs text-blue-600">숫자 순서만으로 점수가 계산됩니다</p>
          </div>
          <div className="space-y-2">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-600 font-bold text-lg mb-3 block">입력된 숫자 순서:</span>
              <div className="flex flex-wrap justify-center gap-2">
                {answers[currentQuestion]?.sequence?.split('').map((digit, index) => (
                  <div key={index} className="w-12 h-12 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-xl font-bold text-blue-700">
                    {digit}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAttentionPhase('sequence')} variant="outline" className="flex-1">이전 단계로</Button>
            <Button onClick={() => { 
              console.log('주의력 테스트 "다음 단계로" 버튼 클릭');
              console.log('현재 답변:', answers[currentQuestion]);
              console.log('sequence 값:', answers[currentQuestion]?.sequence);
              console.log('sequence 타입:', typeof answers[currentQuestion]?.sequence);
              console.log('sequence 길이:', answers[currentQuestion]?.sequence?.length);
              
              // handleScore 호출하지 않고 바로 handleNext 호출
              // handleNext 내에서 점수 계산 및 저장
              handleNext();
            }} className="flex-1">다음 단계로</Button>
          </div>
        </>
      )}
    </div>
  );

  const calculateAttentionScore = (answer: any) => {
    if (!answer) {
      console.log('답변이 없음');
      return 0;
    }
    let score = 0;
    
    console.log('주의력 테스트 답변:', answer);
    console.log('answer.sequence 존재 여부:', !!answer.sequence);
    
    if (answer.sequence) {
      const userSequence = String(answer.sequence).replace(/[,_\s]/g, '');
      const correctSequence = '21845';
      const sequenceCorrect = userSequence === correctSequence;
      console.log(`숫자 순서: 사용자답변="${userSequence}", 정답="${correctSequence}", 정답여부=${sequenceCorrect}`);
      console.log(`사용자답변 길이: ${userSequence.length}, 정답 길이: ${correctSequence.length}`);
      if (sequenceCorrect) {
        score += 5; // 숫자 순서만으로 만점 5점
        console.log('숫자 순서 정답! +5점');
      } else if (userSequence.length > 0) {
        score += 2; // 부분 점수
        console.log('숫자 순서 부분 점수! +2점');
      } else {
        console.log('숫자 순서 0점');
      }
    } else {
      console.log('sequence 답변 없음');
    }
    
    console.log('최종 점수:', score);
    return score;
  };

  const renderFluencyTest = () => {

    return (
      <div className="space-y-4">
        <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
          <p className="text-base md:text-lg font-medium text-blue-800 mb-2">ㄱ으로 시작하는 실제 한국어 단어를 6개이상 입력해주세요</p>
          
          {/* 진행 안내 */}
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-700 font-medium">📋 진행 안내</div>
            <div className="text-xs text-blue-600 mt-1">
              • <strong>"단어 검증하기"</strong> 버튼을 눌러 검증을 완료하세요<br/>
              • <strong>2분 시간이 지나면</strong> 입력이 자동으로 잠깁니다<br/>
              • 검증 완료 후 <strong>"다음"</strong> 버튼을 눌러 진행하세요
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>ㄱ으로 시작하는 단어들을 입력하세요 (쉼표로 구분)</Label>
            <div className="text-sm font-medium">
              {isFluencyTimerRunning ? (
                <div className="text-center">
                  <div className={`text-lg font-bold ${fluencyTimeLeft <= 30 ? 'text-red-600' : 'text-blue-600'}`}>
                    {Math.floor(fluencyTimeLeft / 60)}:{(fluencyTimeLeft % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-600">남은 시간</div>
                  
                  {/* 진행률 바 */}
                  <div className="mt-2 w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${fluencyTimeLeft <= 30 ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${((120 - fluencyTimeLeft) / 120) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <span className="text-gray-600">제한시간: 2분</span>
              )}
            </div>
          </div>
          <Textarea 
            value={typeof answers[currentQuestion] === 'string' ? answers[currentQuestion] : (answers[currentQuestion]?.text || '')} 
            onChange={(e) => {
              // 시간이 종료되었거나 검증이 완료되었으면 입력 차단
              if (fluencyTimeLeft === 0 || showFluencyResults) return;
              
              handleAnswer(e.target.value);
              // 첫 입력 시 타이머 시작
              if (!isFluencyTimerRunning && e.target.value.trim()) {
                console.log('🚀 첫 입력 감지! 타이머 시작');
                setIsFluencyTimerRunning(true);
              }
            }} 
            disabled={fluencyTimeLeft === 0 || showFluencyResults}
            rows={4} 
            placeholder={
              fluencyTimeLeft === 0 
                ? "⏰ 시간이 종료되었습니다. 입력이 잠겼습니다." 
                : "ㄱ으로 시작하는 단어들을 쉼표로 구분하여 입력하세요"
            }
            className={
              fluencyTimeLeft === 0 || showFluencyResults 
                ? "bg-gray-100 cursor-not-allowed" 
                : ""
            }
          />

          {/* 검증 버튼 */}
          <div className="text-center">
            <Button 
              onClick={() => {
                validateWords();
                // 수동 검증 시 타이머 정지
                setIsFluencyTimerRunning(false);
              }}
              disabled={isValidating || !answers[currentQuestion]}
              className="w-full"
            >
              {isValidating ? "검증 중..." : "단어 검증하기"}
            </Button>
          </div>
        </div>

        {/* 검증 결과 표시 */}
        {showFluencyResults && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-lg font-bold text-blue-800 mb-3 text-center">검증 결과</h4>
              
              {/* 검증 완료 안내 */}
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="text-green-800 font-medium">✅ 검증 완료!</div>
                <div className="text-green-600 text-sm mt-1">"다음" 버튼을 눌러 다음 문제로 진행하세요</div>
              </div>
              
              <div className="space-y-2">
                {Object.entries(validationResults).map(([word, isValid]) => (
                  <div key={word} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="font-medium">{word}</span>
                    <div className="flex items-center space-x-2">
                      {isValid ? (
                        <span className="text-green-600 font-bold">✅ 유효</span>
                      ) : (
                        <span className="text-red-600 font-bold">❌ 무효</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-white rounded border text-center">
                <span className="text-lg font-bold text-blue-800">
                  유효한 단어: {fluencyTotalScore}개 / {Object.keys(validationResults).length}개
                </span>
                <div className="mt-2">
                  <span className={`text-xl font-bold ${fluencyTotalScore >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                    최종 점수: {fluencyTotalScore >= 6 ? '1점' : '0점'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const calculateFluencyScore = (answer: any) => {
    console.log('유창성 테스트 점수 계산 시작:', answer);
    
    // API 검증 결과가 있으면 6개 모두 맞으면 1점, 아니면 0점
    if (typeof answer === 'object' && answer.isValidated && answer.validationScore !== undefined) {
      console.log('API 검증 결과 사용:', answer.validationScore);
      return answer.validationScore >= 6 ? 1 : 0;
    }

    // API 검증이 완료되지 않은 경우, 검증 결과에서 점수 계산
    if (validationResults && Object.keys(validationResults).length > 0) {
      const validCount = Object.values(validationResults).filter(Boolean).length;
      console.log('검증 결과에서 계산:', validCount);
      return validCount >= 6 ? 1 : 0;
    }

    // 기본 검증 (API 검증이 없는 경우) - 6개 이상이면 1점
    const inputText = (answer || '') as string;
    const words = inputText.split(',').map((w: string) => w.trim()).filter((w: string) => w.length > 0);
    
    console.log('기본 검증 사용 - 입력된 단어들:', words);
    
    // 기본 ㄱ 초성 검증
    const validWords = words.filter((word: string) => {
      if (word.length === 0) return false;
      if (!/^[가-깋]/.test(word)) return false;
      if (!/^[가-힣]+$/.test(word)) return false;
      return true;
    });
    
    console.log('기본 검증 - 유효한 단어들:', validWords);
    const score = validWords.length >= 6 ? 1 : 0;
    console.log('기본 검증 - 최종 점수:', score);
    
    return score;
  };

  const renderAbstractionTest = () => (
    <div className="space-y-6">
      <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">다음 두 단어의 공통점을 찾아보세요</h3>
        
        {/* 문제 1: 자전거와 기차 */}
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-lg font-bold text-blue-800 mb-4">1. 자전거와 기차</h4>
          
          {/* 답변 표시 영역 */}
          <div className="bg-white p-4 rounded-lg border border-blue-300 mb-4">
            <div className="text-center">
              <span className="text-blue-600 font-bold text-lg mb-3 block">선택된 공통점:</span>
                                <div className="flex flex-wrap justify-center gap-2">
                    {answers[currentQuestion]?.bicycle ? (
                      <div className="px-3 py-2 bg-white text-blue-700 border-2 border-blue-300 rounded-lg font-semibold">
                        {answers[currentQuestion].bicycle}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">공통점을 선택하세요</span>
                    )}
                  </div>
            </div>
          </div>
          
          {/* 공통점 선택 버튼들 */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-blue-800 mb-3 text-center">공통점을 선택하세요:</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {['동물', '교통수단', '음식', '가구', '전자제품', '의류'].map((word) => (
                <Button
                  key={`bicycle-${word}`}
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const currentAnswers = answers[currentQuestion] || {};
                    // 하나만 선택하도록 수정
                    handleAnswer({ ...currentAnswers, bicycle: word });
                  }}
                  className={`h-12 text-sm font-medium transition-all duration-200 ${
                    answers[currentQuestion]?.bicycle === word
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                  }`}
                >
                  {word}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* 문제 2: 사과와 복숭아 */}
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-lg font-bold text-blue-800 mb-4">2. 사과와 복숭아</h4>
          
          {/* 답변 표시 영역 */}
          <div className="bg-white p-4 rounded-lg border border-blue-300 mb-4">
            <div className="text-center">
              <span className="text-blue-600 font-bold text-lg mb-3 block">선택된 공통점:</span>
                                <div className="flex flex-wrap justify-center gap-2">
                    {answers[currentQuestion]?.apple ? (
                      <div className="px-3 py-2 bg-white text-blue-700 border-2 border-blue-300 rounded-lg font-semibold">
                        {answers[currentQuestion].apple}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">공통점을 선택하세요</span>
                    )}
                  </div>
            </div>
          </div>
          
          {/* 공통점 선택 버튼들 */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-blue-800 mb-3 text-center">공통점을 선택하세요:</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {['교통수단', '과일', '동물', '가구', '전자제품', '운동기구'].map((word) => (
                <Button
                  key={`apple-${word}`}
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const currentAnswers = answers[currentQuestion] || {};
                    // 하나만 선택하도록 수정
                    handleAnswer({ ...currentAnswers, apple: word });
                  }}
                  className={`h-12 text-sm font-medium transition-all duration-200 ${
                    answers[currentQuestion]?.apple === word
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                  }`}
                >
                  {word}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* 답변 초기화 버튼 */}
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleAnswer({ ...answers[currentQuestion], bicycle: '', apple: '' });
            }}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            답변 초기화
          </Button>
        </div>
      </div>
    </div>
  );

  const calculateAbstractionScore = (answer: any) => {
    if (!answer) return 0;
    let score = 0;
    
    console.log('공통점 찾기 답변:', answer);
    
    // 자전거와 기차 공통점
    const bicycleCorrect = answer.bicycle && (answer.bicycle.includes('교통') || answer.bicycle.includes('이동') || answer.bicycle.includes('탈'));
    console.log(`자전거-기차: 사용자답변=${answer.bicycle}, 정답여부=${bicycleCorrect}`);
    if (bicycleCorrect) score += 1;
    
    // 사과와 복숭아 공통점
    const appleCorrect = answer.apple && (answer.apple.includes('과일') || answer.apple.includes('식용') || answer.apple.includes('달콤'));
    console.log(`사과-복숭아: 사용자답변=${answer.apple}, 정답여부=${appleCorrect}`);
    if (appleCorrect) score += 1;
    
    console.log('최종 점수:', score);
    return score;
  };

  const renderOrientationTest = () => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg font-medium mb-4">현재 상황에 대한 질문에 답하세요</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>오늘 날짜</Label>
          <Input 
            placeholder="예: 2024년 12월 25일" 
            value={answers[currentQuestion]?.date || ''} 
            onChange={(e) => handleAnswer({ ...answers[currentQuestion], date: e.target.value })}
          />
        </div>
                 <div className="space-y-2">
           <Label>현재 장소</Label>
           <Input
             placeholder="예: 집, 병원, 회사"
             value={answers[currentQuestion]?.place || ''}
             onChange={(e) => handleAnswer({ ...answers[currentQuestion], place: e.target.value })}
             className="flex-1"
           />
         </div>
        <div className="space-y-2">
          <Label>현재 시간</Label>
          <Input 
            placeholder="예: 오후 3시 30분" 
            value={answers[currentQuestion]?.time || ''} 
            onChange={(e) => handleAnswer({ ...answers[currentQuestion], time: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  const calculateOrientationScore = async (answer: any) => {
    const userAnswer = answer || {};
    let score = 0;
    const now = new Date();
    
    if (userAnswer.date) {
      if (userAnswer.date.includes(now.getFullYear().toString())) score += 1;
      if (userAnswer.date.includes((now.getMonth() + 1).toString())) score += 1;
      if (userAnswer.date.includes(now.getDate().toString())) score += 1;
    }
        if (userAnswer.place && userAnswer.place.length > 0) {
      // AI API를 사용한 장소 판별로 점수 계산
      try {
        const isValidPlace = await checkPlaceWithAI(userAnswer.place);
        if (isValidPlace) {
          score += 1; // AI가 장소로 인정하면 1점
        }
      } catch (error) {
        console.error('장소 판별 API 오류:', error);
        // API 오류 시 0점 처리
      }
    }
    if (userAnswer.time) {
      const timeStr = userAnswer.time.toString();
      
      console.log('지남력 테스트 시간 답변:', timeStr);
      
      // 숫자가 포함되어 있으면 시간 형식으로 인정
      if (/\d/.test(timeStr)) {
        // 현재 시간과 비교하여 정확성 검증
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        console.log('현재 시간:', currentHour + '시 ' + currentMinute + '분');
        
        // 시간 추출 (다양한 형식 지원)
        let inputHour = 0;
        let inputMinute = 0;
        
        // 다양한 시간 형식에서 시간과 분 추출
        if (timeStr.includes(':') || timeStr.includes('.')) {
          // 12:10, 12.10, 1:3, 1.3 등의 형식
          const parts = timeStr.split(/[:.]/);
          if (parts.length >= 2) {
            inputHour = parseInt(parts[0]);
            inputMinute = parseInt(parts[1]);
          }
        } else if (timeStr.includes('시') && timeStr.includes('분')) {
          // 15시4분, 3시30분 등의 형식
          const hourMatch = timeStr.match(/(\d+)시/);
          const minuteMatch = timeStr.match(/(\d+)분/);
          if (hourMatch) inputHour = parseInt(hourMatch[1]);
          if (minuteMatch) inputMinute = parseInt(minuteMatch[1]);
        } else if (timeStr.includes('시')) {
          // 15시, 3시 등의 형식
          const hourMatch = timeStr.match(/(\d+)시/);
          if (hourMatch) {
            inputHour = parseInt(hourMatch[1]);
            inputMinute = 0;
          }
        } else if (timeStr.length >= 2) {
          // 1210, 13, 1,3 등의 형식
          if (timeStr.length === 2) {
            // 13, 1,3 형식
            inputHour = parseInt(timeStr);
            inputMinute = 0;
          } else if (timeStr.length === 3) {
            // 130 형식
            inputHour = parseInt(timeStr.substring(0, 1));
            inputMinute = parseInt(timeStr.substring(2));
          } else if (timeStr.length === 4) {
            // 1210 형식
            inputHour = parseInt(timeStr.substring(0, 2));
            inputMinute = parseInt(timeStr.substring(2));
          }
        }
        
        // 오후/오전 시간을 24시간 형식으로 변환
        // 오후 3시 = 15시, 오후 12시 = 12시, 오전 12시 = 0시
        if (inputHour >= 1 && inputHour <= 11) {
          // 오후 시간으로 가정 (1시~11시는 오후로 처리)
          inputHour += 12;
        } else if (inputHour === 12) {
          // 12시는 오후 12시로 가정 (12시 = 12시)
          inputHour = 12;
        }
        // 0시는 그대로 0시
        
        console.log('입력된 시간:', inputHour + '시 ' + inputMinute + '분');
        
        // 현재 시간과 비교 (2분 이내 오차만 허용)
        const hourDiff = Math.abs(inputHour - currentHour);
        const minuteDiff = Math.abs(inputMinute - currentMinute);
        
        console.log('시간 차이:', hourDiff + '시간 ' + minuteDiff + '분');
        
        if (hourDiff === 0 && minuteDiff <= 2) {
          score += 2; // 정확한 시간이면 만점 (2분 이내 오차만)
          console.log('시간 정답! +2점');
        } else {
          score += 0; // 시간이 틀리면 0점
          console.log('시간 오답! +0점');
        }
      } else {
        console.log('시간에 숫자가 없음');
      }
    }
    
    return Math.min(score, 6);
  };

  const renderTestContent = () => {
    console.log('🎯 renderTestContent 호출:', { 
      currentQuestion, 
      currentQuestionData, 
      type: currentQuestionData?.type 
    });
    
    if (!currentQuestionData) {
      console.error('❌ currentQuestionData가 없음!');
      return <div>로딩 중...</div>;
    }
    
    switch (currentQuestionData.type) {
      case 'trail-making':
        return renderTrailMakingTest();
      case 'naming':
        return renderNamingTest();
      case 'memory':
        return renderMemoryTest();
      case 'attention':
        return renderAttentionTest();
      case 'fluency':
        return renderFluencyTest();
      case 'abstraction':
        return renderAbstractionTest();
      case 'orientation':
        return renderOrientationTest();
      default:
        console.warn('⚠️ 알 수 없는 문제 타입:', currentQuestionData.type);
        return (
          <div className="text-center space-y-4">
            <p className="text-lg font-medium">{currentQuestionData.category} • {currentQuestionData.maxPoints}점</p>
            <p className="text-blue-600">이 검사는 아직 구현 중입니다. 곧 완성될 예정입니다.</p>
          </div>
        );
    }
  };

  const getTotalScore = () => Object.values(scores).reduce((sum, score) => sum + (score || 0), 0) + 6; // 기본점수 6점 추가
  const getMaxScore = () => 30; // MOCA 표준 만점

  if (showResults) {
    const totalScore = getTotalScore();
    const maxScore = getMaxScore();
    const percentage = Math.round((totalScore / maxScore) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9] p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Brain className="h-7 w-7 text-primary" />
              <h1 className="text-xl md:text-2xl font-bold text-blue-900">
                {currentTest === 'MOCA' ? '종합 인지 평가' : '간이 인지 검사'} 검사 결과
              </h1>
            </div>
          </div>
          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">총점: {totalScore} / {maxScore}</CardTitle>
              <CardDescription>{percentage}% 달성</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                                  <div className="text-3xl font-bold text-primary mb-2">{totalScore}</div>
                <p className="text-blue-600">점수 (기본점수 6점 포함)</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions.map((q, index) => (
                  <div key={q.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{q.title}</span>
                      <span className="text-sm text-blue-600">{scores[index] || 0} / {q.maxPoints}</span>
                    </div>
                    <Progress value={((scores[index] || 0) / q.maxPoints) * 100} className="h-2" />
                  </div>
                ))}
                <div className="p-4 border rounded-lg bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">기본점수 (구현 예정 기능)</span>
                    <span className="text-sm text-blue-600">6 / 6</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-center">
            <Button onClick={handleFinishTest}>
              {currentTest === 'MOCA' ? 'MMSE(간이정신상태검사)로 이동' : '검사 완료'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9] p-4 pb-24">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 lg:space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/test-mode-selection">
                <ArrowLeft className="h-4 w-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">뒤로</span>
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
              <span className="text-lg lg:text-xl font-bold text-blue-900">
                {currentTest === 'MOCA' ? '종합 인지 평가' : '간이 인지 검사'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* TTS 제어 버튼들 */}
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs lg:text-sm">
                {currentQuestion + 1}/{questions.length}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
        {/* Guest mode notification */}
        {!isLoggedIn && (
          <div className="mb-4 sm:mb-6 p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-blue-800 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs sm:text-sm font-medium">게스트 모드로 진행 중</span>
            </div>
            <p className="text-xs text-blue-700 text-center">
              로그인하지 않은 상태로 테스트를 진행합니다. 결과는 PDF로 다운로드할 수 있지만, 
              검사 기록은 저장되지 않습니다.
            </p>
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs sm:text-sm font-medium text-blue-900">진행률: {currentQuestion + 1} / {questions.length}</span>
            <span className="text-xs sm:text-sm text-blue-600">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        {/* Question Card */}
        {currentQuestionData ? (
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {currentQuestionData.category}
                </Badge>
                <div className="flex items-center space-x-2 text-blue-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{currentQuestionData.maxPoints}점</span>
                </div>
              </div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg md:text-xl mb-2">{currentQuestionData.title}</CardTitle>
              </div>
              
              {/* TTS 컨트롤 버튼들 - 문제 옆에 배치 */}
              {isVoiceMode && (
                <div className="flex items-center space-x-2 flex-shrink-0">
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
                        onClick={speakQuestion}
                        className="h-8 px-2"
                        title="문제 다시 듣기"
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
              <div className="mt-3 p-2 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-700">
                  <Volume2 className="h-4 w-4" />
                                     <span className="text-sm">
                     {isSpeaking ? "음성 안내 중..." : "문제가 읽혔습니다. 다시 듣려면 🔄 버튼을 클릭하세요."}
                   </span>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>{renderTestContent()}          </CardContent>
        </Card>
        ) : (
          <div className="text-center p-8">
            <p className="text-lg text-gray-600">로딩 중...</p>
          </div>
        )}
        {/* Sticky Navigation (mobile) */}
        {currentQuestionData && (
          <div className="fixed left-0 right-0 bottom-0 z-40 md:static md:mt-4 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-t md:border-0 p-3 md:p-0">
            <div className="flex justify-center items-center gap-2">
              <div className="text-sm text-blue-600 mr-0 md:mr-3 hidden md:block">{currentQuestionData.category} • {currentQuestionData.maxPoints}점</div>
            <Button 
              onClick={handleNext} 
              disabled={questions[currentQuestion]?.type === 'fluency' && !showFluencyResults} 
              className="md:w-auto shrink-0" 
              style={{ width: 'auto' }}
            >
              {currentQuestion === questions.length - 1 ? '결과 보기' : '다음'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
        )}
        
      </div>
    </div>
  );
}
