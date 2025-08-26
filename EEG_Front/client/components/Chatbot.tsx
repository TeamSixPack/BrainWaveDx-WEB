import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User,
  Brain,
  Heart,
  BookOpen,
  Lightbulb,
  RotateCcw
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'suggestion' | 'normal';
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  userDiagnosis?: string;
}

export default function Chatbot({ isOpen, onClose, userDiagnosis = "normal" }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `안녕하세요! 저는 NeuroScan AI 어시스턴트입니다. 뇌 건강 결과를 이해하고 궁금한 점에 답변해드리기 위해 여기 있습니다.

테스트를 바탕으로 다음과 같은 도움을 드릴 수 있습니다:
• ${userDiagnosis} 결과에 대한 자세한 설명
• 뇌 건강과 인지 기능에 대한 정보
• 뇌 건강 유지를 위한 생활 습관 권장사항
• 정서적 지원 및 안내

어떤 것에 대해 더 자세히 알고 싶으신가요?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);



  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      console.log('Scroll Debug Info:', {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
        clientHeight: container.clientHeight,
        scrollable: container.scrollHeight > container.clientHeight
      });

      container.scrollTop = container.scrollHeight;
    }

    // Fallback to element scroll
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest"
    });
  };

  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const quickSuggestions = [
    { icon: Brain, text: "내 결과를 자세히 설명해주세요", category: "interpretation" },
    { icon: BookOpen, text: "정상적인 뇌 건강이란 무엇인가요?", category: "information" },
    { icon: Lightbulb, text: "뇌 건강을 어떻게 개선할 수 있나요?", category: "enhancement" },
    { icon: Heart, text: "내 결과가 걱정됩니다", category: "support" }
  ];

  const generateBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('result') || message.includes('explain') || message.includes('detail') || message.includes('결과') || message.includes('설명') || message.includes('자세')) {
      return `"${userDiagnosis}" 뇌 건강 상태를 보여주는 테스트 결과를 바탕으로:

뇌파 분석 결과 균형잡힌 뇌파 패턴을 보여주었습니다:
• 알파파 78% - 양호한 편안한 각성 상태를 나타냄
• 베타파 82% - 건강한 인지 처리를 보여줌
• 전체 뇌파 점수 92/100 - 우수한 뇌 활동

모든 영역에서 강한 인지 기능 테스트 성과를 보였습니다:
• 기억력: 88% - 우수한 단기 기억력
• 주의력: 82% - 양호한 지속적 주의력
• 처리 속도: 87% - 평균 이상의 성과

이러한 결과는 인지 저하의 징후 없이 건강한 뇌 기능을 나타냅니다. 특정 측면에 대해 더 자세히 설명해드릴까요?`;
    }
    
    if (message.includes('normal') || message.includes('healthy') || message.includes('brain health')) {
      return `Normal brain health means your cognitive functions are working optimally! Here's what this means:

🧠 **Cognitive Function**: Your memory, attention, and processing speed are all functioning well
🌊 **Brainwave Patterns**: Your EEG shows balanced electrical activity across different frequency bands
🔗 **Brain Connectivity**: Good communication between different brain regions
⚖️ **Hemispheric Balance**: Equal activity between left and right brain hemispheres

Signs of healthy brain function include:
• Clear thinking and good concentration
• Effective memory formation and recall
• Good problem-solving abilities
• Stable mood and emotional regulation

Keep up the great work maintaining your brain health!`;
    }
    
    if (message.includes('improve') || message.includes('enhance') || message.includes('lifestyle') || message.includes('recommendation')) {
      return `Great question! Here are evidence-based ways to maintain and enhance your brain health:

🏃‍♀️ **Physical Exercise**
• 150 minutes of moderate exercise weekly
• Activities like walking, swimming, or dancing
• Exercise increases BDNF (brain-derived neurotrophic factor)

🧠 **Mental Stimulation**
• Learn new skills or languages
• Solve puzzles and play strategy games
• Read regularly and engage in creative activities

🥗 **Nutrition**
• Mediterranean diet rich in omega-3 fatty acids
• Blueberries, nuts, and leafy greens
• Limit processed foods and excess sugar

😴 **Quality Sleep**
• 7-9 hours of sleep nightly
• Consistent sleep schedule
• Sleep is crucial for memory consolidation

🧘‍♀️ **Stress Management**
• Meditation and mindfulness practices
• Social connections and relationships
• Regular relaxation techniques

Would you like specific recommendations for any of these areas?`;
    }
    
    if (message.includes('worried') || message.includes('concern') || message.includes('anxious') || message.includes('fear') || message.includes('걱정') || message.includes('우려') || message.includes('불안')) {
      return `건강 테스트가 때때로 걱정을 일으킬 수 있다는 것을 이해하지만, 귀하의 결과는 실제로 매우 긍정적입니다! 이를 올바른 관점에서 보도록 도와드리겠습니다:

**귀하의 결과는 안심할 만합니다**
• 진단 결과 "정상 뇌 건강"을 보여줍니다
• 87% 신뢰도는 신뢰할 만한 결과를 나타냅니다
• 모든 주요 지표가 건강한 범위 내에 있습니다

**이것이 의미하는 바**
• 인지 저하의 징후가 감지되지 않았습니다
• 뇌가 최적으로 기능하고 있습니다
• 조기 감지 시스템이 올바른 방향으로 가고 있음을 보여줍니다

**귀하는 적극적으로 행동하고 있습니다**
• 이 테스트를 받는 것은 건강을 염려한다는 것을 보여줍니다
• 조기 모니터링이 최고의 예방법입니다
• 향후 비교를 위한 기준선이 있습니다

📋 **다음 단계**
• 건강한 생활 습관을 계속 유지하세요
• 의료진과 정기 검진을 받으세요
• 시간이 지나면서 변화를 모니터링하세요

기억하세요: 이 테스트는 스크리닝 도구이며, 귀하의 긍정적인 결과는 우수한 뇌 건강을 나타냅니다. 특정 우려사항이 있으시면 의료 전문가와 상담하시면 추가적인 안심을 얻을 수 있습니다.

결과에 대해 특별히 걱정되는 부분이 있나요?`;
    }
    
    if (message.includes('mci') || message.includes('mild cognitive impairment')) {
      return `Mild Cognitive Impairment (MCI) is a condition where cognitive changes are noticeable but don't significantly interfere with daily life:

**What is MCI?**
• Cognitive changes beyond normal aging
• Memory, thinking, or judgment problems
• Still able to perform daily activities independently

**Warning Signs**
• Frequent memory lapses
• Difficulty finding words
• Problems with complex tasks
• Changes in judgment or decision-making

**Important to Know**
• Not everyone with MCI develops dementia
• Some people with MCI remain stable or even improve
• Early intervention can help slow progression

🏥 **If Concerned**
• Consult with a neurologist or geriatrician
• Comprehensive neuropsychological testing
• Regular monitoring and follow-up

Based on your current results showing normal brain health, you don't need to worry about MCI right now, but it's good to be informed!`;
    }
    
    if (message.includes('dementia') || message.includes('alzheimer')) {
      return `I understand you're asking about dementia and Alzheimer's disease. Here's important information:

**About Dementia**
• General term for severe cognitive decline
• Interferes with daily life and independence
• Progressive condition affecting memory, thinking, and behavior

**Alzheimer's Disease**
• Most common type of dementia (60-80% of cases)
• Characterized by specific brain changes
• Involves plaques and tangles in brain tissue

**Risk Factors**
• Age (primary risk factor)
• Family history and genetics
• Lifestyle factors (diet, exercise, sleep)
• Cardiovascular health

**Prevention Strategies**
• Regular physical and mental exercise
• Healthy diet (Mediterranean style)
• Social engagement and connections
• Managing chronic conditions

**Your Current Status**
Your assessment shows normal brain health with no signs of cognitive decline. This is excellent news! Continue your healthy habits and regular monitoring.

Remember: Having questions about these conditions is normal and shows you're being proactive about your brain health.`;
    }

    // Default response
    return `질문해 주셔서 감사합니다! 다음과 같은 정보로 도움을 드릴 수 있습니다:

• **결과 해석**: 뇌 건강 테스트 이해하기
• **뇌 건강 교육**: 인지 기능과 뇌 건강에 대해 학습하기
• **생활 습관 안내**: 뇌 건강 유지 및 개선을 위한 가이드
• **정서적 지원**: 우려 사항 해결 및 안심 제공

무엇에 대해 알고 싶으신지 더 구체적으로 말씀해 주시겠어요? 아래 제안된 주제 중 하나를 클릭하여 시작할 수도 있습니다.`;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsTyping(true);

    // Simulate bot response delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateBotResponse(newMessage),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNewMessage(suggestion);
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        content: `안녕하세요! 저는 NeuroScan AI 어시스턴트입니다. 뇌 건강 결과를 이해하고 궁금한 점에 답변드리기 위해 여기 있습니다.

테스트를 바탕으로 다음과 같은 도움을 드릴 수 있습니다:
• ${userDiagnosis} 결과에 대한 자세한 설명
• 뇌 건강과 인지 기능에 대한 정보
• 뇌 건강 유지를 위한 생활 습관 권장사항
• 정서적 지원 및 안내

어떤 것에 대해 더 자세히 알고 싶으신가요?`,
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
              <div className="absolute inset-0 bg-blue-500/20 pointer-events-auto" onClick={onClose} />

      {/* Chatbot Dialog - Anchored to bottom-right, full width on mobile */}
      <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:right-4 sm:left-auto w-auto sm:w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl pointer-events-auto">
        <Card className="flex flex-col min-h-[300px] sm:min-h-[400px] max-h-[calc(100vh-80px)] sm:max-h-[calc(100vh-120px)] shadow-2xl border-0 bg-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">NeuroScan AI 어시스턴트</CardTitle>
              <CardDescription>뇌 건강 지원 및 안내</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTop = 0;
                }
              }}
              title="맨 위로 스크롤"
            >
              ↑
            </Button>
            <Button variant="ghost" size="sm" onClick={clearChat} title="채팅 초기화">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} title="채팅 닫기">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages Area with native scrolling */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
            style={{
              maxHeight: 'calc(100vh - 300px)',
              minHeight: '200px'
            }}
            onScroll={(e) => {
              const target = e.target as HTMLDivElement;
              console.log('Scrolling:', {
                scrollTop: target.scrollTop,
                scrollHeight: target.scrollHeight,
                clientHeight: target.clientHeight
              });
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === 'user' ? 'bg-primary' : 'bg-muted'}`}>
                    {message.sender === 'user' ? (
                      <User className="h-3 w-3 text-primary-foreground" />
                    ) : (
                      <Bot className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className={`p-3 rounded-lg shadow-sm ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="p-3 bg-background border rounded-lg shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} className="h-1" />
          </div>

          {/* Quick Suggestions - Fixed position when visible */}
          {messages.length <= 1 && (
            <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur-sm px-6 py-3">
              <div className="grid grid-cols-2 gap-2">
                {quickSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="justify-start h-auto py-2 px-3 text-left"
                  >
                    <suggestion.icon className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="text-xs">{suggestion.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}


          {/* Input Area - Always fixed at bottom */}
          <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur-sm px-6 py-4">
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="뇌 건강에 대해 무엇이든 물어보세요..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isTyping}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isTyping}
                size="sm"
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
