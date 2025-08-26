import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, MessageCircle, X, Send, Plus, ArrowLeft } from "lucide-react";

interface MemoryChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}

interface Conversation {
  id: string;
  title: string;
  date: string;
  summary: string;
}

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

export default function MemoryChatbot({ isOpen, onClose, isLoggedIn }: MemoryChatbotProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userResponse, setUserResponse] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [conversationStep, setConversationStep] = useState<'question' | 'listening' | 'analyzing' | 'result'>('question');
  
  // 대화 기록 관리 - 로그인 상태에 따라 다르게 처리
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !currentConversationId) {
      startNewConversation();
    }
  }, [isOpen]);

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      // 챗봇이 열릴 때 브라우저 히스토리에 상태 추가
      window.history.pushState({ chatbot: true }, '');
    }

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startNewConversation = () => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      title: `기억력 상담 #${conversations.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      summary: '새로운 상담 시작'
    };
    
    // 로그인된 사용자만 대화 기록에 저장
    if (isLoggedIn) {
      setConversations(prev => [newConversation, ...prev]);
    }
    
    setCurrentConversationId(newId);
    setMessages([]);
    setConversationStep('question');
    setUserResponse("");
    setAnalysis("");
    
    // 챗봇이 첫 질문하기
    setTimeout(() => askQuestion(), 500);
  };

  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // 실제 구현에서는 해당 대화 내용을 불러와야 함
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: '안녕하세요! 최근에 기억에 관련된 일이 있으신가요?',
        timestamp: new Date()
      }
    ]);
    setConversationStep('listening');
  };

  const askQuestion = () => {
    setIsSpeaking(true);
    const botMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: "안녕하세요! 저는 의료 전문가가 검증한 AI 건강 상담 시스템입니다. 최근에 기억력이나 인지 기능과 관련된 변화가 있으신가요? 예를 들어, 물건을 자주 잃어버리거나, 중요한 일정을 까먹거나, 집중력이 떨어지는 등의 경험이 있으시다면 마이크 버튼을 눌러서 자세히 말씀해 주세요. 전문가 수준의 해석과 신뢰할 수 있는 결과를 제공해드리겠습니다.",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, botMessage]);
    
    const utterance = new SpeechSynthesisUtterance(botMessage.content);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setConversationStep('listening');
    };
    
    speechSynthesis.speak(utterance);
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
      setConversationStep('listening');
    } catch (error) {
      console.error('마이크 접근 오류:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setConversationStep('analyzing');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    // 시뮬레이션: 사용자 음성 응답
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: "네, 최근에 자주 물건을 어디에 두었는지 까먹고, 중요한 일정도 잊어버리는 것 같아요.",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserResponse(userMessage.content);
    
    // 분석 중...
    setConversationStep('analyzing');
    
    // 시뮬레이션: 잠시 후 분석 결과 표시
    setTimeout(() => {
      const analysisText = "사용자의 음성 응답을 분석한 결과, 최근 기억력 저하 증상이 관찰됩니다. 물건을 자주 잃어버리고, 중요한 일정을 까먹는 경험이 있다고 하셨습니다. 이는 일시적인 스트레스나 피로로 인한 것일 수 있으나, 지속적인 증상이라면 전문의와 상담을 권장합니다.";
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: analysisText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setAnalysis(analysisText);
      setConversationStep('result');
      
      // 대화 요약 업데이트
      updateConversationSummary(analysisText);
      
      // 결과를 음성으로 읽어주기
      speakResult(analysisText);
    }, 2000);
  };

  const updateConversationSummary = (summary: string) => {
    if (currentConversationId && isLoggedIn) {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversationId 
            ? { ...conv, summary: summary.substring(0, 50) + '...' }
            : conv
        )
      );
    }
  };

  const speakResult = (text: string) => {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    speechSynthesis.speak(utterance);
  };

  const handleTextInput = () => {
    if (!inputText.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    
    // 챗봇 응답 시뮬레이션
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "텍스트 입력을 받았습니다. 음성 입력을 원하시면 마이크 버튼을 눌러주세요.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const resetConversation = () => {
    startNewConversation();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background flex z-50">
             {/* 왼쪽 사이드바 - 대화 기록 (2) */}
               <div className="w-1/5 bg-white border-r border-border flex flex-col">
         <div className="p-4 border-b border-border">
           <Button 
             onClick={startNewConversation}
             className="w-full bg-primary hover:bg-primary/90"
           >
             <Plus className="h-4 w-4 mr-2" />
             새 상담 시작
           </Button>
         </div>
         
         <div className="flex-1 overflow-y-auto p-2">
           {isLoggedIn ? (
             // 로그인된 사용자: 대화 기록 표시
             conversations.length > 0 ? (
               conversations.map((conversation) => (
                 <div
                   key={conversation.id}
                   onClick={() => selectConversation(conversation.id)}
                   className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                     currentConversationId === conversation.id
                       ? 'bg-primary/10 border border-primary/20'
                       : 'hover:bg-blue-50'
                   }`}
                 >
                                <h4 className="font-medium text-sm text-blue-900 mb-1">
               {conversation.title}
             </h4>
                           <p className="text-xs text-blue-700 mb-1">
               {conversation.date}
             </p>
                           <p className="text-xs text-blue-700 line-clamp-2">
               {conversation.summary}
             </p>
                 </div>
               ))
             ) : (
                              <div className="text-center text-blue-500 py-8">
                 <p className="text-sm text-blue-700">아직 상담 기록이 없습니다.</p>
                 <p className="text-xs mt-1 text-blue-700">새로운 상담을 시작해보세요!</p>
                </div>
             )
           ) : (
             // 비로그인 사용자: 로그인 안내
                          <div className="text-center text-blue-500 py-8">
               <p className="text-sm font-medium text-blue-700">로그인이 필요합니다</p>
               <p className="text-xs mt-2 text-blue-700">
                상담 기록을 저장하고<br/>
                이전 대화를 확인하려면<br/>
                로그인해주세요.
               </p>
              </div>
           )}
         </div>
       </div>

      {/* 오른쪽 메인 영역 - 대화 내용 및 요약 (8) */}
      <div className="flex-1 flex flex-col">
                 {/* 헤더 */}
         <div className="border-b border-border p-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
               <ArrowLeft className="h-4 w-4" />
             </Button>
                           <h2 className="text-lg font-semibold text-blue-900">AI 건강 상담</h2>
           </div>
           <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
             <X className="h-4 w-4" />
           </Button>
         </div>

        {/* 대화 내용 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-blue-50 text-blue-900'
                }`}
              >
                                               <p className="text-sm text-blue-900">{message.content}</p>
                <p className="text-xs text-blue-700 opacity-70 mt-1">
                 {message.timestamp.toLocaleTimeString()}
               </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
              placeholder="텍스트로 입력하거나 마이크를 사용하세요..."
              className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={handleTextInput} disabled={!inputText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 음성 입력 컨트롤 */}
          <div className="flex justify-center mt-3 gap-2">
            {conversationStep === 'listening' && (
              <Button 
                onClick={stopListening}
                className="bg-red-600 hover:bg-red-700"
                disabled={!isListening}
              >
                <MicOff className="h-4 w-4 mr-2" />
                녹음 중지
              </Button>
            )}
            
            {conversationStep === 'listening' && !isListening && (
              <Button 
                onClick={startListening}
                className="bg-green-600 hover:bg-green-700"
              >
                <Mic className="h-4 w-4 mr-2" />
                음성 녹음
              </Button>
            )}
            
            {conversationStep === 'result' && (
              <Button onClick={resetConversation} className="w-full">
                새로운 상담 시작
              </Button>
            )}
          </div>

          {/* 상태 표시 */}
                     <div className="text-center text-xs text-blue-500 mt-2">
            {conversationStep === 'question' && "질문을 음성으로 들려드리는 중..."}
            {conversationStep === 'listening' && "사용자 음성 입력 대기 중..."}
            {conversationStep === 'analyzing' && "음성 분석 중..."}
            {conversationStep === 'result' && "분석 완료"}
            {isSpeaking && "챗봇이 말하는 중..."}
            {isListening && "마이크 녹음 중..."}
          </div>
        </div>
      </div>
    </div>
  );
}
