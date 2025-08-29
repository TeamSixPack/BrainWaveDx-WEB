import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Brain, ArrowLeft, ArrowRight, CheckCircle, Clock, AlertCircle, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { saveCognitiveScore } from "@/lib/api";

// OpenAI API를 사용한 장소 판별 함수
const checkPlaceWithAI = async (word: string): Promise<boolean> => {
  try {
    console.log('🔍 장소 판별 AI 채점 시작:', word);
    
    const response = await fetch('http://localhost:8000/check_place', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ place: word }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('🔍 장소 판별 API 응답:', result);
    
    // Flask 서버 응답 형식에 맞춰 수정
    const isValidPlace = result.status === 'ok' && result.detected_place;
    console.log('🔍 장소 판별 최종 결과:', isValidPlace);
    
    return isValidPlace;
  } catch (error) {
    console.error('❌ 장소 판별 API 호출 오류:', error);
    throw error;
  }
};

// OpenAI API를 사용한 MoCA Q3 답변 검증 함수
const checkMocaQ3WithAI = async (answer: string): Promise<boolean> => {
  try {
    console.log('🔍 MoCA Q3 AI 채점 시작:', answer);
    
    const response = await fetch('http://localhost:8000/check_moca_q3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answer }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('🔍 MoCA Q3 API 응답:', result);
    
    // Flask 서버 응답 형식에 맞춰 수정
    const isAppropriate = result.status === 'ok' && result.is_appropriate;
    console.log('🔍 MoCA Q3 최종 결과:', isAppropriate);
    
    return isAppropriate;
  } catch (error) {
    console.error('❌ MoCA Q3 검증 API 호출 오류:', error);
    throw error;
  }
};

// OpenAI API를 사용한 MoCA Q4 답변 검증 함수
const checkMocaQ4WithAI = async (answer: string): Promise<boolean> => {
  try {
    console.log('🔍 MoCA Q4 AI 채점 시작:', answer);
    
    const response = await fetch('http://localhost:8000/check_moca_q4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answer }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('🔍 MoCA Q4 API 응답:', result);
    
    // Flask 서버 응답 형식에 맞춰 수정
    const isAppropriate = result.status === 'ok' && result.is_appropriate;
    console.log('🔍 MoCA Q4 최종 결과:', isAppropriate);
    
    return isAppropriate;
  } catch (error) {
    console.error('❌ MoCA Q4 검증 API 호출 오류:', error);
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

// 요일을 한국어로 변환하는 함수
function getKoreanDayOfWeek(day: number): string {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return days[day];
}

// 현재 계절을 구하는 함수
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return '봄';
  if (month >= 6 && month <= 8) return '여름';
  if (month >= 9 && month <= 11) return '가을';
  return '겨울';
}

// 한국어 형태소 분리 함수 (어간 추출)
function getKoreanStems(word: string): string[] {
  console.log(`\n=== getKoreanStems 함수 호출: "${word}" ===`);
  
  const stems = [word]; // 원본 단어도 포함
  console.log(`원본 단어 추가: "${word}"`);
  
  // 기본 어미 패턴들
  const basicEndings = [
    '하다', '되다', '있다', '없다', '지다', '리다', '이다',
    '음', '기', '는', '은', '을', '이', '가', '의', '에', '로', '로부터',
    '고', '며', '거나', '지만', '게', '게끔', '도록', '지', '고도', '고서'
  ];
  
  // 연결어미 패턴들 (더 정교하게 처리)
  const connectiveEndings = [
    '아서', '어서', '여서', '니까', '아도', '어도', '여도', 
    '아야', '어야', '여야', '아라', '어라', '여라', '아지', '어지', '여지',
    '아네', '어네', '여네', '아요', '어요', '여요', '아다', '어다', '여다'
  ];
  
  // 기본 어미 제거
  basicEndings.forEach(ending => {
    if (word.endsWith(ending)) {
      const stem = word.slice(0, -ending.length);
      if (stem.length > 0) {
        stems.push(stem);
        console.log(`기본 어미 "${ending}" 제거: "${stem}"`);
      }
    }
  });
  
  // 연결어미 제거 (더 정교하게)
  connectiveEndings.forEach(ending => {
    if (word.endsWith(ending)) {
      const stem = word.slice(0, -ending.length);
      if (stem.length > 0) {
        stems.push(stem);
        console.log(`연결어미 "${ending}" 제거: "${stem}"`);
      }
    }
  });
  
  // 특정 패턴들에 대한 어간 추출
  if (word.endsWith('적')) {
    const stem = word.slice(0, -1);
    stems.push(stem);
    console.log(`'적' 제거: "${stem}"`);
  }
  if (word.endsWith('하다')) {
    const stem = word.slice(0, -2);
    stems.push(stem);
    console.log(`'하다' 제거: "${stem}"`);
  }
  if (word.endsWith('되다')) {
    const stem = word.slice(0, -2);
    stems.push(stem);
    console.log(`'되다' 제거: "${stem}"`);
  }
  
  // 한국어 어간 변화 패턴 처리 (더 정교하게)
  // 예: 더럽다 -> 더러워서, 더러우니까, 더러워도 등
  if (word.endsWith('어서') || word.endsWith('어도') || word.endsWith('어야') || 
      word.endsWith('어라') || word.endsWith('어지') || word.endsWith('어네') || 
      word.endsWith('어요') || word.endsWith('어다')) {
    // '어'로 끝나는 경우, 앞부분이 어간
    const beforeEo = word.slice(0, -2);
    if (beforeEo.length > 0) {
      stems.push(beforeEo);
      console.log(`'어'로 끝나는 경우 처리: "${beforeEo}"`);
      // 추가로 '다' 제거한 형태도 추가
      if (beforeEo.endsWith('다')) {
        const stem = beforeEo.slice(0, -1);
        stems.push(stem);
        console.log(`'다' 제거: "${stem}"`);
      }
    }
  }
  
  // '니까' 패턴 특별 처리
  if (word.endsWith('니까')) {
    const beforeNikka = word.slice(0, -3);
    if (beforeNikka.length > 0) {
      stems.push(beforeNikka);
      console.log(`'니까' 제거: "${beforeNikka}"`);
      // '다' 제거한 형태도 추가
      if (beforeNikka.endsWith('다')) {
        const stem = beforeNikka.slice(0, -1);
        stems.push(stem);
        console.log(`'니까' 후 '다' 제거: "${stem}"`);
      }
    }
  }
  
  const result = [...new Set(stems)]; // 중복 제거
  console.log(`최종 어간들:`, result);
  console.log(`=== getKoreanStems 함수 완료 ===\n`);
  
  return result;
}

type MMSEQuestion = {
  id: number;
  category: string;
  subCategory: string;
  question: string;
  type: "text" | "number" | "textarea";
  placeholder?: string;
  maxLength?: number;
  correctAnswer?: string;
  points: number;
};

const mmseQuestions: MMSEQuestion[] = [
  {
    id: 1,
    category: "지남력",
    subCategory: "시간",
    question: "오늘은 몇 년입니까?",
    type: "number",
    placeholder: "예: 2024",
    points: 1,
    correctAnswer: new Date().getFullYear().toString()
  },
  {
    id: 2,
    category: "지남력",
    subCategory: "시간",
    question: "오늘은 몇 월입니까?",
    type: "number",
    placeholder: "예: 12",
    points: 1,
    correctAnswer: (new Date().getMonth() + 1).toString()
  },
  {
    id: 3,
    category: "지남력",
    subCategory: "시간",
    question: "오늘은 몇 일입니까?",
    type: "number",
    placeholder: "예: 25",
    points: 1,
    correctAnswer: new Date().getDate().toString()
  },
  {
    id: 4,
    category: "지남력",
    subCategory: "시간",
    question: "오늘은 무슨 요일입니까?",
    type: "text",
    placeholder: "예: 월요일",
    points: 1,
    correctAnswer: getKoreanDayOfWeek(new Date().getDay())
  },
  {
    id: 5,
    category: "지남력",
    subCategory: "시간",
    question: "오늘은 어떤 계절입니까?",
    type: "text",
    placeholder: "예: 봄",
    points: 1,
    correctAnswer: getCurrentSeason()
  },
  {
    id: 6,
    category: "지남력", 
    subCategory: "장소",
    question: "현재 장소가 어디입니까?",
    type: "text",
    placeholder: "장소를 입력하세요",
    points: 1
  },
  {
    id: 7,
    category: "기억력",
    subCategory: "기억등록 안내",
    question: "세 가지 단어를 보여드릴 것입니다. 잘 기억해주세요.",
    type: "text",
    placeholder: "안내를 읽었습니다",
    points: 0
  },
  {
    id: 8,
    category: "기억력",
    subCategory: "기억등록",
    question: "다음 세 단어를 따라서 말해보세요",
    type: "textarea",
    placeholder: "세 단어를 순서대로 입력하세요",
    points: 3,
    correctAnswer: "나무, 자동차, 모자"
  },
  {
    id: 9,
    category: "주의집중 및 계산",
    subCategory: "수리력",
    question: "100에서 7을 빼고, 그 결과에서 다시 7을 빼는 계산을 5회 해주세요.",
    type: "text",
    placeholder: "계산 결과를 입력하세요",
    points: 5,
    correctAnswer: "93, 86, 79, 72, 65"
  },
  {
    id: 10,
    category: "기억력",
    subCategory: "기억회상",
    question: "앞서 말씀드린 세 단어를 다시 말해보세요.",
    type: "textarea",
    placeholder: "기억나는 단어를 입력하세요",
    points: 3,
    correctAnswer: "나무, 자동차, 모자"
  },
  {
    id: 11,
    category: "언어기능",
    subCategory: "이름말하기",
    question: "이 물건들의 이름을 선택하세요.",
    type: "text",
    placeholder: "물건의 이름을 선택하세요",
    points: 2
  },
  {
    id: 12,
    category: "언어기능",
    subCategory: "이해",
    question: "왜 옷은 빨아서 입습니까?",
    type: "textarea",
    placeholder: "답변을 입력하세요",
    points: 3
  },
  {
    id: 13,
    category: "이해 및 판단",
    subCategory: "판단",
    question: "길에서 주민등록증을 주웠을 때 어떻게 하면 쉽게 주인에게 돌려줄 수 있습니까?",
    type: "textarea",
    placeholder: "답변을 입력하세요",
    points: 1
  }
];

export default function MMSE() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [memoryPhase, setMemoryPhase] = useState<'show' | 'input'>('show');
  const [memoryCountdown, setMemoryCountdown] = useState(2);
  const [isMemoryCountdownRunning, setIsMemoryCountdownRunning] = useState(false);
  
  // TTS 관련 상태
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  
  // URL 파라미터에서 MOCA 점수 읽어오기
  const urlParams = new URLSearchParams(window.location.search);
  const mocaScore = urlParams.get('mocaScore');
  const mocaMaxScore = urlParams.get('mocaMaxScore');
  const mocaPercentage = urlParams.get('mocaPercentage');
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  // 테스트 모드 확인
  const testMode = sessionStorage.getItem('testMode') || 'voice';
  const isVoiceMode = testMode === 'voice';

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

  const repeatQuestion = () => {
    const currentQ = mmseQuestions[currentQuestion];
    
    // 기억등록 문제는 TTS 음성 안내 제외
    if (currentQ.id === 8) {
      return;
    }
    
    let textToSpeak = currentQ.question; // 카테고리 제거하고 문제만 읽기
    
    // 특별한 문제들에 대한 추가 안내
    if (currentQ.id === 9) {
      textToSpeak += " 100에서 7을 5번 빼는 계산입니다.";
    } else if (currentQ.id === 11) {
      textToSpeak += " 화면에 보이는 물건의 이름을 입력하세요.";
    }
    
    speakText(textToSpeak);
  };

  // 완료 시 점수 계산
  useEffect(() => {
    if (isComplete && finalScore === null) {
      const calculateFinalScore = async () => {
        let totalScore = 0;
        
        // 기본점수 7점 추가 (지남력 5문제 + 기억등록 안내 0점 + 이름말하기 2점)
        totalScore += 7;
        
        for (const question of mmseQuestions) {
          // 안내 문제(id: 7)는 점수 계산에서 제외
          if (question.id === 7) continue;
          
          const answer = answers[question.id];
          if (answer && question.correctAnswer) {
            // 정답이 있는 경우 정답 체크
            if (question.id === 11) {
              // 이름말하기 문제: 연필, 시계 순서 정확히 체크
              const names = answer.split(',').map(n => n.trim());
              if (names.length === 2 && names[0] === '연필' && names[1] === '시계') {
                totalScore += question.points; // 2점
              }
            } else if (question.type === "number") {
              // 숫자 입력의 경우 정확한 값과 비교
              if (answer.trim() === question.correctAnswer) {
                totalScore += question.points;
              }
            } else if (question.id === 8 || question.id === 10) {
              // 기억등록, 기억회상 문제: 순서 상관없이 단어만 맞으면 정답
              const answerWords = answer.toLowerCase().trim().split(',').map(w => w.trim());
              const correctWords = question.correctAnswer.toLowerCase().trim().split(',').map(w => w.trim());
              
              // 모든 정답 단어가 포함되어 있는지 확인 (순서 무관)
              const allCorrectWordsFound = correctWords.every(correctWord => 
                answerWords.some(answerWord => answerWord === correctWord)
              );
              
              if (allCorrectWordsFound && answerWords.length === correctWords.length) {
                totalScore += question.points;
              }
            } else {
              // 텍스트 입력의 경우 유사도 체크 (대소문자, 공백 무시)
              const normalizedAnswer = answer.toLowerCase().trim().replace(/\s+/g, '');
              const normalizedCorrect = question.correctAnswer.toLowerCase().trim().replace(/\s+/g, '');
              if (normalizedAnswer === normalizedCorrect) {
                totalScore += question.points;
              }
            }
          } else if (answer && !question.correctAnswer) {
            // 정답이 없는 경우 (장소 문제, 이름말하기 문제) 키워드 검증
            if (question.id === 6) {
              // 장소 문제: AI API를 사용한 장소 판별
              if (answer && answer.length > 0) {
                try {
                  console.log('🔍 장소 문제 AI 채점 시작:', answer);
                  const isValidPlace = await checkPlaceWithAI(answer);
                  console.log('🔍 장소 문제 AI 채점 결과:', isValidPlace);
                  if (isValidPlace) {
                    totalScore += question.points; // AI가 장소로 인정하면 점수
                    console.log('✅ 장소 문제 점수 획득:', question.points, '점');
                  } else {
                    console.log('❌ 장소 문제 점수 미획득');
                  }
                } catch (error) {
                  console.error('장소 판별 API 오류:', error);
                  // API 오류 시 0점 처리
                }
              }
            } else if (question.id === 11) {
              // 이름말하기 문제: 연필, 시계 순서 정확히 체크
              const names = answer.split(',').map(n => n.trim());
              if (names.length === 2 && names[0] === '연필' && names[1] === '시계') {
                totalScore += question.points; // 2점
              }
            } else if (question.id === 12) {
              // 12번 문제: 왜 옷은 빨아서 입습니까? - AI API를 사용한 답변 검증
              if (answer && answer.length > 0) {
                try {
                  console.log('🔍 12번 문제 AI 채점 시작:', answer);
                  const isAppropriate = await checkMocaQ3WithAI(answer);
                  console.log('🔍 12번 문제 AI 채점 결과:', isAppropriate);
                  if (isAppropriate) {
                    totalScore += question.points; // AI가 적절하다고 판단하면 점수
                    console.log('✅ 12번 문제 점수 획득:', question.points, '점');
                  } else {
                    console.log('❌ 12번 문제 점수 미획득');
                  }
                } catch (error) {
                  console.error('MoCA Q3 검증 API 오류:', error);
                  // API 오류 시 0점 처리
                }
              }
            } else if (question.id === 13) {
              // 13번 문제: 판단 문제 - AI API를 사용한 답변 검증
              if (answer && answer.length > 0) {
                try {
                  console.log('🔍 13번 문제 AI 채점 시작:', answer);
                  const isAppropriate = await checkMocaQ4WithAI(answer);
                  console.log('🔍 13번 문제 AI 채점 결과:', isAppropriate);
                  if (isAppropriate) {
                    totalScore += question.points; // AI가 적절하다고 판단하면 점수
                    console.log('✅ 13번 문제 점수 획득:', question.points, '점');
                  } else {
                    console.log('❌ 13번 문제 점수 미획득');
                  }
                } catch (error) {
                  console.error('MoCA Q4 검증 API 오류:', error);
                  // API 오류 시 0점 처리
                }
              }
            }
          }
        }
        
        console.log('🔍 최종 총점 계산 완료:', totalScore);
        setFinalScore(totalScore);
      };
      calculateFinalScore();
    }
  }, [isComplete, finalScore, answers]);

  // 문제 변경 시 자동 음성 안내
  useEffect(() => {
    if (isTTSEnabled && !isComplete) {
      const currentQ = mmseQuestions[currentQuestion];
      
      // 기억등록 문제는 TTS 음성 안내 제외
      if (currentQ.id === 8) {
        return;
      }
      
      let textToSpeak = currentQ.question; // 카테고리 제거하고 문제만 읽기
      
      // 특별한 문제들에 대한 추가 안내
      if (currentQ.id === 9) {
        textToSpeak += " 100에서 7을 5번 빼는 계산입니다.";
      } else if (currentQ.id === 11) {
        textToSpeak += " 화면에 보이는 물건의 이름을 입력하세요.";
      }
      
      // 약간의 지연 후 음성 안내 (사용자가 준비할 시간)
      const timer = setTimeout(() => {
        speakText(textToSpeak);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, isTTSEnabled, isComplete]);

  // 기억등록 문제 처리
  useEffect(() => {
    if (currentQuestion === 7) { // id: 8은 0-based index로 7
      setMemoryPhase('show');
      setMemoryCountdown(2);
      setIsMemoryCountdownRunning(true);
      
      // 2초 카운트다운 시작
      const countdownInterval = setInterval(() => {
        setMemoryCountdown(prev => {
          if (prev <= 0.1) {
            setIsMemoryCountdownRunning(false);
            setMemoryPhase('input');
            // TTS로 입력 단계 안내
            if (isTTSEnabled) {
              speakText("이제 기억한 단어들을 입력하실 수 있습니다. 쉼표로 구분하여 입력해주세요.");
            }
            return 2;
          }
          return prev - 0.1;
        });
      }, 100);
      
      return () => {
        clearInterval(countdownInterval);
        setIsMemoryCountdownRunning(false);
      };
    }
  }, [currentQuestion, isTTSEnabled]);

  // 기억등록 문제 상태 초기화
  useEffect(() => {
    if (currentQuestion !== 7) {
      setMemoryPhase('show');
      setMemoryCountdown(2);
      setIsMemoryCountdownRunning(false);
    }
  }, [currentQuestion]);

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [mmseQuestions[currentQuestion].id]: value
    }));
  };

     const handleNext = () => {
     if (currentQuestion < mmseQuestions.length - 1) {
       // 현재 음성 정지
       if (isTTSEnabled) {
         stopSpeaking();
       }
       
       setCurrentQuestion(prev => prev + 1);
       
       // 기억등록 문제 상태 초기화
       if (currentQuestion === 7) {
         setMemoryPhase('show');
       }
     } else {
       if (isTTSEnabled) {
         speakText("모든 문제를 완료했습니다. 결과를 확인해주세요.");
       }
       
       // MMSE 검사 완료 시 상세 결과 페이지 표시
       setIsComplete(true);
     }
   };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      
      // 기억등록 문제 상태 초기화
      if (currentQuestion === 8) {
        setMemoryPhase('show');
      }
    }
  };

    // 점수 계산 함수 (AI 채점 포함)
    const calculateScore = async () => {
      let totalScore = 0;
      
      // 기본점수 7점 추가 (지남력 5문제 + 기억등록 안내 0점 + 이름말하기 2점)
      totalScore += 7;
      
      for (const question of mmseQuestions) {
        // 안내 문제(id: 7)는 점수 계산에서 제외
        if (question.id === 7) continue;
        
        const answer = answers[question.id];
        if (answer && question.correctAnswer) {
          // 정답이 있는 경우 정답 체크
          if (question.id === 11) {
            // 이름말하기 문제: 연필, 시계 순서 정확히 체크
            const names = answer.split(',').map(n => n.trim());
            if (names.length === 2 && names[0] === '연필' && names[1] === '시계') {
              totalScore += question.points; // 2점
            }
          } else if (question.type === "number") {
            // 숫자 입력의 경우 정확한 값과 비교
            if (answer.trim() === question.correctAnswer) {
              totalScore += question.points;
            }
          } else if (question.id === 8 || question.id === 10) {
            // 기억등록, 기억회상 문제: 순서 상관없이 단어만 맞으면 정답
            const answerWords = answer.toLowerCase().trim().split(',').map(w => w.trim());
            const correctWords = question.correctAnswer.toLowerCase().trim().split(',').map(w => w.trim());
            
            // 모든 정답 단어가 포함되어 있는지 확인 (순서 무관)
            const allCorrectWordsFound = correctWords.every(correctWord => 
              answerWords.some(answerWord => answerWord === correctWord)
            );
            
            if (allCorrectWordsFound && answerWords.length === correctWords.length) {
              totalScore += question.points;
            }
                     } else {
            // 텍스트 입력의 경우 유사도 체크 (대소문자, 공백 무시)
            const normalizedAnswer = answer.toLowerCase().trim().replace(/\s+/g, '');
            const normalizedCorrect = question.correctAnswer.toLowerCase().trim().replace(/\s+/g, '');
            if (normalizedAnswer === normalizedCorrect) {
              totalScore += question.points;
            }
          }
                 } else if (answer && !question.correctAnswer) {
           // 정답이 없는 경우 (장소 문제, 이름말하기 문제, AI 채점 문제) 키워드 검증
           if (question.id === 6) {
             // 장소 문제: AI API를 사용한 장소 판별
             if (answer && answer.length > 0) {
               try {
                 console.log('🔍 장소 문제 AI 채점 시작:', answer);
                 const isValidPlace = await checkPlaceWithAI(answer);
                 console.log('🔍 장소 문제 AI 채점 결과:', isValidPlace);
                 if (isValidPlace) {
                   totalScore += question.points; // AI가 장소로 인정하면 점수
                   console.log('✅ 장소 문제 점수 획득:', question.points, '점');
                 } else {
                   console.log('❌ 장소 문제 점수 미획득');
                 }
               } catch (error) {
                 console.error('장소 판별 API 오류:', error);
                 // API 오류 시 0점 처리
               }
             }
           } else if (question.id === 11) {
             // 이름말하기 문제: 연필, 시계 순서 정확히 체크
             const names = answer.split(',').map(n => n.trim());
             if (names.length === 2 && names[0] === '연필' && names[1] === '시계') {
               totalScore += question.points; // 2점
             }
           } else if (question.id === 12) {
             // 12번 문제: 왜 옷은 빨아서 입습니까? - AI API를 사용한 답변 검증
             if (answer && answer.length > 0) {
               try {
                 console.log('🔍 12번 문제 AI 채점 시작:', answer);
                 const isAppropriate = await checkMocaQ3WithAI(answer);
                 console.log('🔍 12번 문제 AI 채점 결과:', isAppropriate);
                 if (isAppropriate) {
                   totalScore += question.points; // AI가 적절하다고 판단하면 점수
                   console.log('✅ 12번 문제 점수 획득:', question.points, '점');
                 } else {
                   console.log('❌ 12번 문제 점수 미획득');
                 }
               } catch (error) {
                 console.error('MoCA Q3 검증 API 오류:', error);
                 // API 오류 시 0점 처리
               }
             }
           } else if (question.id === 13) {
             // 13번 문제: 판단 문제 - AI API를 사용한 답변 검증
             if (answer && answer.length > 0) {
               try {
                 console.log('🔍 13번 문제 AI 채점 시작:', answer);
                 const isAppropriate = await checkMocaQ4WithAI(answer);
                 console.log('🔍 13번 문제 AI 채점 결과:', isAppropriate);
                 if (isAppropriate) {
                   totalScore += question.points; // AI가 적절하다고 판단하면 점수
                   console.log('✅ 13번 문제 점수 획득:', question.points, '점');
                 } else {
                   console.log('❌ 13번 문제 점수 미획득');
                 }
               } catch (error) {
                 console.error('MoCA Q4 검증 API 오류:', error);
                 // API 오류 시 0점 처리
               }
             }
           }
         }
      }
      
      console.log('🔍 calculateScore 함수 최종 총점:', totalScore);
      return totalScore;
    };

  const handleComplete = async () => {
    // MMSE 결과를 처리하고 결과 페이지로 이동 (MOCA 점수와 MMSE 점수 전달)
    const mmseScore = await calculateScore();
    setFinalScore(mmseScore);
    const mmseMaxScore = 30; // MMSE 표준 만점
    const mmsePercentage = Math.round((mmseScore / mmseMaxScore) * 100);

    // 로그인한 사용자만 점수 저장 (게스트 모드 사용자는 저장하지 않음)
    if (isLoggedIn) {
      const sessionIdxStr = sessionStorage.getItem('currentSessionIdx');
      const sessionIdx = sessionIdxStr ? parseInt(sessionIdxStr) : null;
      if (sessionIdx) {
        // 현재는 EEG 미실시이므로 인지 점수만 저장
        saveCognitiveScore(sessionIdx, 'MMSE', mmseScore).catch(() => {});
      }
    }
    
    const resultsUrl = mocaScore && mocaMaxScore && mocaPercentage
      ? `/results?mocaScore=${mocaScore}&mocaMaxScore=30&mocaPercentage=${mocaPercentage}&mmseScore=${mmseScore}&mmseMaxScore=30&mmsePercentage=${mmsePercentage}`
      : `/results?mmseScore=${mmseScore}&mmseMaxScore=30&mmsePercentage=${mmsePercentage}`;
    navigate(resultsUrl);
  };

  const progress = ((currentQuestion + 1) / mmseQuestions.length) * 100;
  const currentQ = mmseQuestions[currentQuestion];

    if (isComplete && finalScore !== null) {
    const mmseScore = finalScore;
    const mmseMaxScore = 30;
    const mmsePercentage = Math.round((mmseScore / mmseMaxScore) * 100);
    
    // MMSE 점수에 따른 판정 기준
    let diagnosis = '';
    let diagnosisColor = '';
    let diagnosisBgColor = '';
    
    if (mmseScore >= 24) {
      diagnosis = '정상';
      diagnosisColor = 'text-green-600';
      diagnosisBgColor = 'bg-green-50';
    } else if (mmseScore >= 19) {
      diagnosis = '경도인지장애';
      diagnosisColor = 'text-yellow-600';
      diagnosisBgColor = 'bg-yellow-50';
    } else {
      diagnosis = '중증인지장애';
      diagnosisColor = 'text-red-600';
      diagnosisBgColor = 'bg-red-50';
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9] p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Brain className="h-7 w-7 text-primary" />
                             <h1 className="text-xl md:text-2xl font-bold text-blue-900">간이 인지 검사 결과</h1>
            </div>
          </div>
          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">총점: {mmseScore} / {mmseMaxScore}</CardTitle>
              <CardDescription>{mmsePercentage}% 달성</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{mmseScore}</div>
                  <p className="text-blue-600">점수 (기본점수 7점 포함)</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    // 각 영역별 점수 계산
                    const scores = {
                      orientation: 0,    // 지남력 (6점)
                      memory: 0,         // 기억등록 (3점)
                      calculation: 0,    // 수리력 (5점)
                      recall: 0,         // 기억회상 (3점)
                      naming: 0,         // 이름말하기 (2점)
                      comprehension: 0,  // 이해 (3점)
                      judgment: 0,       // 판단 (1점)
                      basic: 7           // 기본점수 (7점)
                    };

                    // 각 문제별 점수 계산
                    mmseQuestions.forEach(question => {
                      if (question.id === 7) return; // 안내 문제 제외
                      
                      const answer = answers[question.id];
                      let earnedPoints = 0;
                      
                      if (answer && question.correctAnswer) {
                        if (question.type === "number") {
                          earnedPoints = answer.trim() === question.correctAnswer ? question.points : 0;
                        } else if (question.id === 8 || question.id === 10) {
                          // 기억등록, 기억회상 문제
                          const answerWords = answer.toLowerCase().trim().split(',').map(w => w.trim());
                          const correctWords = question.correctAnswer.toLowerCase().trim().split(',').map(w => w.trim());
                          const allCorrectWordsFound = correctWords.every(correctWord => 
                            answerWords.some(answerWord => answerWord === correctWord)
                          );
                          earnedPoints = (allCorrectWordsFound && answerWords.length === correctWords.length) ? question.points : 0;
                        } else if (question.id === 12 || question.id === 13) {
                          // 이해, 판단 문제 - AI 채점 결과를 확인
                          // finalScore에서 이미 계산된 점수를 사용
                          if (question.id === 12) {
                            // 12번 문제: 이해 문제 (3점)
                            earnedPoints = 0; // 결과창에서는 별도 계산하지 않음
                          } else if (question.id === 13) {
                            // 13번 문제: 판단 문제 (1점)
                            earnedPoints = 0; // 결과창에서는 별도 계산하지 않음
                          }
                        } else if (question.id === 11) {
                          // 이름말하기 문제
                          const names = answer.split(',').map(n => n.trim());
                          earnedPoints = (names.length === 2 && names[0] === '연필' && names[1] === '시계') ? question.points : 0;
                        } else {
                          // 텍스트 입력
                          const normalizedAnswer = answer.toLowerCase().trim().replace(/\s+/g, '');
                          const normalizedCorrect = question.correctAnswer.toLowerCase().trim().replace(/\s+/g, '');
                          earnedPoints = normalizedAnswer === normalizedCorrect ? question.points : 0;
                        }
                      } else if (answer && !question.correctAnswer) {
                        if (question.id === 6) {
                          // 장소 문제
                          const placeStr = answer.toString().toLowerCase();
                          const validPlaceKeywords = [
                            '집', 'home', 'house', '아파트', 'apartment', '빌라', 'villa', '원룸', 'oneroom',
                            '병원', 'hospital', '의원', 'clinic', '약국', 'pharmacy', '치과', 'dental',
                            '회사', 'company', 'office', '사무실', 'school', '학교', '대학교', 'university',
                            '카페', 'cafe', 'restaurant', '식당', '레스토랑', '음식점',
                            '백화점', 'department', '마트', 'mart', 'supermarket', '편의점', 'convenience',
                            '은행', 'bank', '우체국', 'post', '도서관', 'library', '박물관', 'museum',
                            '공원', 'park', '영화관', 'cinema', 'theater', '극장', '체육관', 'gym',
                            '교회', 'church', '사찰', 'temple', '모스크', 'mosque',
                            '역', 'station', '공항', 'airport', '버스', 'bus', '지하철', 'subway',
                            '주차장', 'parking', '주유소', 'gas', '세차장', 'carwash'
                          ];
                          earnedPoints = validPlaceKeywords.some(keyword => 
                            placeStr.includes(keyword.toLowerCase())
                          ) ? question.points : 0;
                        } else if (question.id === 11) {
                          // 이름말하기 문제
                          const names = answer.split(',').map(n => n.trim());
                          earnedPoints = (names.length === 2 && names[0] === '연필' && names[1] === '시계') ? question.points : 0;
                        } else {
                          earnedPoints = question.points;
                        }
                      }

                      // 영역별 점수 누적 (AI 채점 문제 제외)
                      if (question.id >= 1 && question.id <= 6) {
                        scores.orientation += earnedPoints; // 지남력 (1-6번)
                      } else if (question.id === 8) {
                        scores.memory += earnedPoints; // 기억등록 (8번)
                      } else if (question.id === 9) {
                        scores.calculation += earnedPoints; // 수리력 (9번)
                      } else if (question.id === 10) {
                        scores.recall += earnedPoints; // 기억회상 (10번)
                      } else if (question.id === 11) {
                        scores.naming += earnedPoints; // 이름말하기 (11번)
                      }
                      // AI 채점 문제(12번, 13번)는 이미 finalScore에 반영됨
                    });

                     // AI 채점 문제 점수 계산 - finalScore에서 다른 영역 점수를 빼서 AI 점수 역산
                     // finalScore는 이미 AI 채점 결과가 반영된 최종 점수
                     const otherScores = scores.orientation + scores.memory + scores.calculation + scores.recall + scores.naming + scores.basic;
                     const aiTotalScore = mmseScore - otherScores;
                     
                     console.log('🔍 결과창 AI 점수 역산:', {
                       mmseScore: mmseScore,
                       otherScores: otherScores,
                       aiTotalScore: aiTotalScore,
                       answer12: answers[12] || '답변 없음',
                       answer13: answers[13] || '답변 없음'
                     });
                     
                     // AI 총점을 이해(3점)와 판단(1점)으로 분배
                     // aiTotalScore는 실제 AI 채점에서 얻은 점수의 합
                     if (aiTotalScore === 4) {
                       // 둘 다 맞음: 이해 3점 + 판단 1점
                       scores.comprehension = 3;
                       scores.judgment = 1;
                     } else if (aiTotalScore === 3) {
                       // 이해만 맞음: 이해 3점 + 판단 0점
                       scores.comprehension = 3;
                       scores.judgment = 0;
                     } else if (aiTotalScore === 1) {
                       // 판단만 맞음: 이해 0점 + 판단 1점
                       scores.comprehension = 0;
                       scores.judgment = 1;
                     } else {
                       // 둘 다 틀림 또는 답변 없음: 이해 0점 + 판단 0점
                       scores.comprehension = 0;
                       scores.judgment = 0;
                     }
                     
                     console.log('🔍 AI 채점 문제 최종 점수:', {
                       '12번(이해) 점수': scores.comprehension,
                       '13번(판단) 점수': scores.judgment,
                       'AI 총점': aiTotalScore
                     });
                     
                     console.log('🔍 AI 채점 문제 최종 점수:', {
                       comprehension: scores.comprehension,
                       judgment: scores.judgment
                     });
                     
                     // AI 채점 문제 답변 디버깅
                     console.log('🔍 AI 채점 문제 답변:', {
                       '12번(이해)': answers[12] || '답변 없음',
                       '13번(판단)': answers[13] || '답변 없음'
                     });

                    return [
                      // 지남력
                      <div key="orientation" className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">지남력</span>
                          <span className="text-sm text-blue-600">{scores.orientation} / 6</span>
                        </div>
                        <Progress value={(scores.orientation / 6) * 100} className="h-2" />
                      </div>,
                      // 기억등록
                      <div key="memory" className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">기억등록</span>
                          <span className="text-sm text-blue-600">{scores.memory} / 3</span>
                        </div>
                        <Progress value={(scores.memory / 3) * 100} className="h-2" />
                      </div>,
                      // 수리력
                      <div key="calculation" className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">수리력</span>
                          <span className="text-sm text-blue-600">{scores.calculation} / 5</span>
                        </div>
                        <Progress value={(scores.calculation / 5) * 100} className="h-2" />
                      </div>,
                      // 기억회상
                      <div key="recall" className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">기억회상</span>
                          <span className="text-sm text-blue-600">{scores.recall} / 3</span>
                        </div>
                        <Progress value={(scores.recall / 3) * 100} className="h-2" />
                      </div>,
                      // 이름말하기
                      <div key="naming" className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">이름말하기</span>
                          <span className="text-sm text-blue-600">{scores.naming} / 2</span>
                        </div>
                        <Progress value={(scores.naming / 2) * 100} className="h-2" />
                      </div>,
                      // 이해
                      <div key="comprehension" className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">이해</span>
                          <span className="text-sm text-blue-600">{scores.comprehension} / 3</span>
                        </div>
                        <Progress value={(scores.comprehension / 3) * 100} className="h-2" />
                      </div>,
                      // 판단
                      <div key="judgment" className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">판단</span>
                          <span className="text-sm text-blue-600">{scores.judgment} / 1</span>
                        </div>
                        <Progress value={(scores.judgment / 1) * 100} className="h-2" />
                      </div>,
                      // 기본점수
                      <div key="basic" className="p-4 border rounded-lg bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">기본점수</span>
                          <span className="text-sm text-blue-600">{scores.basic} / 7</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>
                    ];
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
                                           <div className="flex justify-center space-x-4">
              <Button onClick={handleComplete}>결과 확인하기</Button>
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
              <Link to="/cognitive-test">
                <ArrowLeft className="h-4 w-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">뒤로</span>
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                             <span className="text-lg lg:text-xl font-bold text-foreground">간이 인지 검사</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* TTS 제어 버튼들 */}
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs lg:text-sm">
                {currentQuestion + 1}/{mmseQuestions.length}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-3xl">
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
            <span className="text-xs sm:text-sm font-medium text-foreground">검사 진행률</span>
            <span className="text-xs sm:text-sm text-muted-foreground">{Math.round(progress)}% 완료</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {currentQ.category}
              </Badge>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs sm:text-sm">{currentQ.points}점</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <CardTitle className="text-base sm:text-lg md:text-xl mb-2">{currentQ.question}</CardTitle>
              </div>
              
              {/* TTS 컨트롤 버튼들 - 문제 옆에 배치 */}
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
                        onClick={repeatQuestion}
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
                  <span className="text-xs sm:text-sm">
                    {isSpeaking ? "음성 안내 중..." : "문제가 자동으로 읽혔습니다. 다시 들으시려면 🔄 버튼을 클릭하세요."}
                  </span>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {/* 기존 입력 UI 그대로 유지 */}
            {currentQ.id === 7 ? (
              <div className="space-y-3 sm:space-y-4 text-center">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">다음 문제에서 세 가지 단어를 보여드릴 것입니다.</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">단어들을 잘 기억해주세요. 2초 후에 입력하실 수 있습니다.</p>
                </div>
              </div>
            ) : currentQ.id === 8 ? (
              <div className="space-y-3 sm:space-y-4 text-center">
                {memoryPhase === 'show' ? (
                  <>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">다음 단어들을 기억하세요. 2초 후 선택하실 수 있습니다.</p>
                    
                    {/* 2초 카운트다운 타이머 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <span className="text-lg font-semibold text-blue-600">
                          {memoryCountdown.toFixed(1)}초 남음
                        </span>
                      </div>
                      
                      {/* 시각적 카운트다운 바 */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-100 ease-linear"
                          style={{ width: `${(memoryCountdown / 2) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-lg sm:text-xl font-bold text-primary">나무</p>
                      <p className="text-lg sm:text-xl font-bold text-primary">자동차</p>
                      <p className="text-lg sm:text-xl font-bold text-primary">모자</p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">기억한 단어들을 선택하세요 (3개 선택)</p>
                    
                    {/* 답변 표시 영역 */}
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 mb-3 sm:mb-4">
                      <div className="text-center">
                        <span className="text-blue-600 font-bold text-base sm:text-lg mb-2 sm:mb-3 block">선택된 단어들:</span>
                        <div className="flex justify-center space-x-2">
                          {answers[8] ? answers[8].split(',').map((word, index) => (
                            <div key={index} className="w-16 h-8 sm:w-20 sm:h-10 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold text-blue-700">
                              {word.trim()}
                            </div>
                          )) : (
                            <div className="w-16 h-8 sm:w-20 sm:h-10 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold text-blue-700">
                              단어 선택
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                     
                                           {/* 단어 선택 버튼들 */}
                      <div className="grid grid-cols-3 gap-3">
                        {['책상', '나무', '컴퓨터', '자동차', '전화기', '모자', '의자', '창문', '문'].map((word) => (
                         <Button
                           key={`word-${word}`}
                           variant="outline"
                           size="lg"
                           onClick={() => {
                             const currentAnswer = answers[8] || '';
                             const words = currentAnswer ? currentAnswer.split(',').map(w => w.trim()) : [];
                             
                             if (words.includes(word)) {
                               // 이미 선택된 단어면 제거
                               const newWords = words.filter(w => w !== word);
                               handleAnswerChange(newWords.join(', '));
                             } else if (words.length < 3) {
                               // 3개 미만이면 추가
                               const newWords = [...words, word];
                               handleAnswerChange(newWords.join(', '));
                             }
                           }}
                           className={`h-16 text-lg font-bold ${
                             answers[8] && answers[8].split(',').map(w => w.trim()).includes(word)
                               ? 'bg-blue-100 border-blue-400 text-blue-800'
                               : 'bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                           }`}
                         >
                           {word}
                         </Button>
                       ))}
                     </div>
                     
                     {/* 선택된 단어 개수 표시 */}
                     <div className="text-sm text-blue-600">
                       {answers[8] ? `${answers[8].split(',').length}/3개 선택됨` : '0/3개 선택됨'}
                     </div>
                     
                     {/* 지우기 버튼 */}
                     <Button
                       variant="outline"
                       size="lg"
                       onClick={() => handleAnswerChange('')}
                       className="px-4 sm:px-6 w-full sm:w-auto"
                     >
                       모두 지우기
                     </Button>
                   </div>
                 )}
               </div>
                         ) : currentQ.id === 11 ? (
                                               // 11번 문제: 이름말하기 (버튼 방식)
                <div className="space-y-4 text-center">
                  <div className="flex justify-center space-x-4 sm:space-x-8 mb-4 sm:mb-6">
                    <img src="/images/pencil.png" alt="연필" className="w-16 h-16 sm:w-24 sm:h-24 object-contain" />
                    <img src="/images/clock.png" alt="시계" className="w-16 h-16 sm:w-24 sm:h-24 object-contain" />
                  </div>
                  
                  {/* 답변 표시 영역 */}
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 mb-4">
                    <div className="text-center">
                      <span className="text-blue-600 font-bold text-base sm:text-lg mb-3 block">선택된 이름들:</span>
                      <div className="flex justify-center space-x-1 sm:space-x-2">
                        {answers[11] ? answers[11].split(',').map((name, index) => (
                          <div key={index} className="w-16 h-8 sm:w-20 sm:h-10 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold text-blue-700">
                            {name.trim()}
                          </div>
                        )) : (
                          <div className="w-16 h-8 sm:w-20 sm:h-10 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold text-blue-700">
                            이름 선택
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 이름 선택 버튼들 */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {['연필', '시계', '펜', '책', '가방', '컵', '전화기', '열쇠', '지갑'].map((name) => (
                      <Button
                        key={`name-${name}`}
                        variant="outline"
                        size="lg"
                                                onClick={() => {
                           const currentAnswer = answers[11] || '';
                           const names = currentAnswer ? currentAnswer.split(',').map(n => n.trim()) : [];
                           
                           if (names.includes(name)) {
                             // 이미 선택된 이름이면 제거
                             const newNames = names.filter(n => n !== name);
                             handleAnswerChange(newNames.join(', '));
                           } else if (names.length < 2) {
                             // 2개 미만이면 추가 (순서 유지)
                             const newNames = [...names, name];
                             handleAnswerChange(newNames.join(', '));
                           }
                         }}
                        className={`h-12 sm:h-16 text-sm sm:text-lg font-bold ${
                          answers[11] && answers[11].split(',').map(n => n.trim()).includes(name)
                            ? 'bg-blue-100 border-blue-400 text-blue-800'
                            : 'bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                        }`}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                  
                  {/* 선택된 이름 개수 표시 */}
                  <div className="text-sm text-blue-600">
                    {answers[11] ? `${answers[11].split(',').length}/2개 선택됨` : '0/2개 선택됨'}
                  </div>
                  
                  {/* 지우기 버튼 */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleAnswerChange('')}
                    className="px-4 sm:px-6 w-full sm:w-auto"
                  >
                    모두 지우기
                  </Button>
                </div>
                         ) : currentQ.id === 1 ? (
                                               // 1번 문제: 년도 선택 (버튼 방식)
                <div className="space-y-4">
                  <div className="text-center">
                    
                    {/* 답변 표시 영역 */}
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 mb-4">
                      <div className="text-center">
                        <span className="text-blue-600 font-bold text-base sm:text-lg mb-3 block">선택된 년도:</span>
                        <div className="flex justify-center">
                          <div className="w-20 h-10 sm:w-24 sm:h-12 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold text-blue-700">
                            {answers[currentQ.id] || '년도 선택'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 년도 선택 버튼들 */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028].map((year) => (
                        <Button
                          key={`year-${year}`}
                          variant="outline"
                          size="lg"
                          onClick={() => handleAnswerChange(year.toString())}
                          className="h-12 sm:h-16 text-sm sm:text-lg font-bold bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                        >
                          {year}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
             ) : currentQ.id === 2 ? (
                                               // 2번 문제: 월 선택 (버튼 방식)
                <div className="space-y-4">
                  <div className="text-center">
                    
                    {/* 답변 표시 영역 */}
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 mb-4">
                      <div className="text-center">
                        <span className="text-blue-600 font-bold text-base sm:text-lg mb-3 block">선택된 월:</span>
                        <div className="flex justify-center">
                          <div className="w-20 h-10 sm:w-24 sm:h-12 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold text-blue-700">
                            {answers[currentQ.id] || '월 선택'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 월 선택 버튼들 (현재 월 기준 ±4개월 범위) */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {(() => {
                        const currentMonth = new Date().getMonth() + 1; // 1-12
                        const months = [];
                        
                        for (let i = -4; i <= 4; i++) {
                          let month = currentMonth + i;
                          
                          // 12월을 넘어가면 1월로, 1월 이하면 12월로 순환
                          if (month > 12) month = month - 12;
                          if (month < 1) month = month + 12;
                          
                          months.push(month);
                        }
                        
                        return months.map((month) => (
                          <Button
                            key={`month-${month}`}
                            variant="outline"
                            size="lg"
                            onClick={() => handleAnswerChange(month.toString())}
                            className="h-12 sm:h-16 text-sm sm:text-lg font-bold bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                          >
                            {month}월
                          </Button>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
             ) : currentQ.id === 3 ? (
                                               // 3번 문제: 일 선택 (현재 일 기준 ±4일 범위)
                <div className="space-y-4">
                  <div className="text-center">
                    
                    {/* 답변 표시 영역 */}
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 mb-4">
                      <div className="text-center">
                        <span className="text-blue-600 font-bold text-base sm:text-lg mb-3 block">선택된 일:</span>
                        <div className="flex justify-center">
                          <div className="w-20 h-10 sm:w-24 sm:h-12 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold text-blue-700">
                            {answers[currentQ.id] || '일 선택'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 일 선택 버튼들 (현재 일 기준 ±4일 범위, 월 경계 순환) */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {(() => {
                        const today = new Date().getDate();
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        
                        // 현재 월의 마지막 일 계산
                        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                        
                        const days = [];
                        
                        // 현재 일 기준 ±4일 범위 생성 (월 경계 순환)
                        for (let i = -4; i <= 4; i++) {
                          let day = today + i;
                          
                          // 월 경계 순환 처리
                          if (day > lastDayOfMonth) {
                            day = day - lastDayOfMonth; // 다음 달로
                          } else if (day < 1) {
                            // 이전 달의 마지막 일 계산
                            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                            const lastDayOfPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
                            day = lastDayOfPrevMonth + day; // 이전 달로
                          }
                          
                          days.push(day);
                        }
                        
                        return days.map((day) => (
                          <Button
                            key={`day-${day}`}
                            variant="outline"
                            size="lg"
                            onClick={() => handleAnswerChange(day.toString())}
                            className="h-12 sm:h-16 text-sm sm:text-lg font-bold bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                          >
                            {day}일
                          </Button>
                        ));
                      })()}
                    </div>
                    
                    
                  </div>
                </div>
             ) : currentQ.id === 4 ? (
                                               // 4번 문제: 요일 선택 (버튼 방식)
                <div className="space-y-4">
                  <div className="text-center">
                    
                    {/* 답변 표시 영역 */}
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 mb-4">
                      <div className="text-center">
                        <span className="text-blue-600 font-bold text-base sm:text-lg mb-3 block">선택된 요일:</span>
                        <div className="flex justify-center">
                          <div className="w-20 h-10 sm:w-24 sm:h-12 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold text-blue-700">
                            {answers[currentQ.id] || '요일 선택'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 요일 선택 버튼들 (현재 요일 기준 ±3요일 범위) */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {(() => {
                        const today = new Date().getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
                        const koreanDays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
                        const days = [];
                        
                        // 현재 요일 기준 ±3요일 범위 생성 (순환)
                        for (let i = -3; i <= 3; i++) {
                          let dayIndex = today + i;
                          
                          // 0-6 범위로 순환
                          if (dayIndex < 0) dayIndex += 7;
                          if (dayIndex >= 7) dayIndex -= 7;
                          
                          days.push(dayIndex);
                        }
                        
                        return days.map((dayIndex) => (
                          <Button
                            key={`day-${dayIndex}`}
                            variant="outline"
                            size="lg"
                            onClick={() => handleAnswerChange(koreanDays[dayIndex])}
                            className="h-12 sm:h-16 text-sm sm:text-lg font-bold bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                          >
                            {koreanDays[dayIndex]}
                          </Button>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
             ) : currentQ.id === 5 ? (
                                               // 5번 문제: 계절 선택 (버튼 방식)
                <div className="space-y-4">
                  <div className="text-center">
                    
                    {/* 답변 표시 영역 */}
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 mb-4">
                      <div className="text-center">
                        <span className="text-blue-600 font-bold text-base sm:text-lg mb-3 block">선택된 계절:</span>
                        <div className="flex justify-center">
                          <div className="w-20 h-10 sm:w-24 sm:h-12 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold text-blue-700">
                            {answers[currentQ.id] || '계절 선택'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 계절 선택 버튼들 (4계절 모두 표시) */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {['봄', '여름', '가을', '겨울'].map((season) => (
                        <Button
                          key={`season-${season}`}
                          variant="outline"
                          size="lg"
                          onClick={() => handleAnswerChange(season)}
                          className="h-12 sm:h-16 text-sm sm:text-lg font-bold bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                        >
                          {season}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                                                                                                                                                                                                                                   ) : currentQ.id === 6 ? (
                                                         // 6번 문제: 장소 인식 확인 (MOCA와 동일한 방식)
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-lg font-medium mb-4">현재 상황에 대한 질문에 답하세요</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>현재 장소</Label>
                          <Input
                            placeholder="예: 집, 병원, 회사"
                            value={answers[currentQ.id] || ''}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                                                               ) : currentQ.id === 9 ? (
                                                           // 9번 문제: 수리력 (100에서 7을 5번 빼기) - 순서대로 선택
                    <div className="space-y-4">
                      <div className="text-center">
                        
                                                {/* 답변 표시 영역 */}
                         <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 mb-4">
                           <div className="text-center">
                             <span className="text-blue-600 font-bold text-base sm:text-lg mb-3 block">선택된 순서:</span>
                                                          <div className="flex justify-center items-center space-x-1 sm:space-x-2 flex-wrap">
                                {answers[9] ? answers[9].split(',').map((num, index) => (
                                  <div key={index} className="w-10 h-6 sm:w-12 sm:h-8 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-xs font-bold text-blue-700 mb-1">
                                    {num.trim()}
                                  </div>
                                )) : (
                                                                  <div className="w-16 h-8 sm:w-20 sm:h-10 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold text-blue-700 whitespace-nowrap">
                                   순서 선택
                                 </div>
                                )}
                              </div>
                           </div>
                         </div>
                        
                                                {/* 답변 선택 버튼들 (정답 포함) */}
                         <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                           {[79, 93, 100, 65, 45, 72, 52, 58, 86, 71, 78, 84].map((number) => (
                            <Button
                              key={`calc-${number}`}
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                const currentAnswer = answers[9] || '';
                                const numbers = currentAnswer ? currentAnswer.split(',').map(n => n.trim()) : [];
                                
                                if (numbers.includes(number.toString())) {
                                  // 이미 선택된 숫자면 제거
                                  const newNumbers = numbers.filter(n => n !== number.toString());
                                  handleAnswerChange(newNumbers.join(', '));
                                } else if (numbers.length < 5) {
                                  // 5개 미만이면 추가
                                  const newNumbers = [...numbers, number.toString()];
                                  handleAnswerChange(newNumbers.join(', '));
                                }
                              }}
                              className={`h-12 sm:h-16 text-sm sm:text-lg font-bold ${
                                answers[9] && answers[9].split(',').map(n => n.trim()).includes(number.toString())
                                  ? 'bg-blue-100 border-blue-400 text-blue-800'
                                  : 'bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                              }`}
                            >
                              {number}
                            </Button>
                          ))}
                        </div>
                        
                        {/* 선택된 숫자 개수 표시 */}
                        <div className="text-sm text-blue-600">
                          {answers[9] ? `${answers[9].split(',').length}/5개 선택됨` : '0/5개 선택됨'}
                        </div>
                        
                        {/* 지우기 버튼 */}
                        <div className="text-center">
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => handleAnswerChange('')}
                            className="px-4 sm:px-6 w-full sm:w-auto"
                          >
                            모두 지우기
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : currentQ.id === 10 ? (
                                                              // 10번 문제: 기억회상 (버튼 방식)
                     <div className="space-y-4">
                       <div className="text-center">
                         
                         {/* 답변 표시 영역 */}
                         <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 mb-4">
                           <div className="text-center">
                             <span className="text-blue-600 font-bold text-base sm:text-lg mb-3 block">기억한 단어들:</span>
                             <div className="flex justify-center space-x-1 sm:space-x-2 flex-wrap">
                               {answers[10] ? answers[10].split(',').map((word, index) => (
                                 <div key={index} className="w-16 h-8 sm:w-20 sm:h-10 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold text-blue-700 mb-1">
                                   {word.trim()}
                                 </div>
                               )) : (
                                 <div className="w-16 h-8 sm:w-20 sm:h-10 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold text-blue-700">
                                   단어 선택
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>
                         
                         {/* 단어 선택 버튼들 */}
                         <div className="grid grid-cols-3 gap-2 sm:gap-3">
                           {['책상', '나무', '컴퓨터', '자동차', '전화기', '모자', '의자', '창문', '문'].map((word) => (
                             <Button
                               key={`recall-${word}`}
                               variant="outline"
                               size="lg"
                               onClick={() => {
                                 const currentAnswer = answers[10] || '';
                                 const words = currentAnswer ? currentAnswer.split(',').map(w => w.trim()) : [];
                                 
                                 if (words.includes(word)) {
                                   // 이미 선택된 단어면 제거
                                   const newWords = words.filter(w => w !== word);
                                   handleAnswerChange(newWords.join(', '));
                                 } else if (words.length < 3) {
                                   // 3개 미만이면 추가
                                   const newWords = [...words, word];
                                   handleAnswerChange(newWords.join(', '));
                                 }
                               }}
                               className={`h-12 sm:h-16 text-sm sm:text-lg font-bold ${
                                 answers[10] && answers[10].split(',').map(w => w.trim()).includes(word)
                                   ? 'bg-blue-100 border-blue-400 text-blue-800'
                                   : 'bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                               }`}
                             >
                               {word}
                             </Button>
                           ))}
                         </div>
                         
                         {/* 선택된 단어 개수 표시 */}
                         <div className="text-sm text-blue-600">
                           {answers[10] ? `${answers[10].split(',').length}/3개 선택됨` : '0/3개 선택됨'}
                         </div>
                         
                         {/* 지우기 버튼 */}
                         <Button
                           variant="outline"
                           size="lg"
                           onClick={() => handleAnswerChange('')}
                           className="px-4 sm:px-6 w-full sm:w-auto"
                         >
                           모두 지우기
                         </Button>
                       </div>
                     </div>
                  ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">답변</label>
                {currentQ.type === 'textarea' ? (
                  <div className="space-y-3">
                    <Textarea
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder={currentQ.placeholder}
                      className="min-h-[100px]"
                      maxLength={currentQ.maxLength}
                    />
                    
                    
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentQ.id === 6 ? (
                      // 장소 문제: AI 판별 버튼 추가
                      <div className="flex space-x-2">
                        <Input
                          type={currentQ.type}
                          value={answers[currentQ.id] || ''}
                          onChange={(e) => handleAnswerChange(e.target.value)}
                          placeholder={currentQ.placeholder}
                          maxLength={currentQ.maxLength}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const place = answers[currentQ.id];
                            if (place) {
                              testPlaceWithAI(place);
                            } else {
                              alert('장소를 먼저 입력해주세요!');
                            }
                          }}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          AI 판별
                        </Button>
                      </div>
                    ) : (
                      // 일반 문제: 기존 입력 필드
                      <Input
                        type={currentQ.type}
                        value={answers[currentQ.id] || ''}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder={currentQ.placeholder}
                        maxLength={currentQ.maxLength}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigation Button (Next only) */}
            <div className="hidden md:flex justify-end pt-4">
              <div className="flex items-center space-x-3">
                <Button onClick={handleNext} className="flex items-center space-x-2">
                  <span>{currentQuestion === mmseQuestions.length - 1 ? "완료" : "다음"}</span>
                  {currentQuestion !== mmseQuestions.length - 1 && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

                 {/* 모바일 스티키 내비게이션 (다음만 표시) */}
         <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-t p-4">
           <div className="flex gap-2">
             <Button onClick={handleNext} className="flex-1 shrink-0 h-12 text-base font-medium">
               {currentQuestion === mmseQuestions.length - 1 ? "완료" : "다음"}
             </Button>
           </div>
         </div>
      </div>
    </div>
  );
}