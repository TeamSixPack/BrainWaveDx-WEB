import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, CheckSquare, Square, Volume2 } from "lucide-react";

type QuestionItem = { id: string; keyword: string };

type Props = {
  isSpeaking: boolean;
  onReplay: () => void;
  selected: string[];
  onToggle: (id: string) => void;
  onStart: () => void;
  questions: QuestionItem[];
};

export default function QuestionSelector({
  isSpeaking,
  onReplay,
  selected,
  onToggle,
  onStart,
  questions,
}: Props) {
  return (
    <Card className="shadow-xl border-0 bg-white relative">
      <CardContent className="p-6 sm:p-12 text-center">
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white shadow px-4 py-2 h-9 "
            disabled={isSpeaking}
            onClick={onReplay}
            title="다시 듣기"
          >
            <Volume2 className="w-5 h-5 mr-2" />
            다시 듣기
          </Button>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          질문 선택
        </h2>
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
          <Bot className="w-14 h-14 sm:w-20 sm:h-20 text-purple-600" />
        </div>
        <p className="text-lg sm:text-2xl font-semibold text-gray-700 text-center mb-6 sm:mb-8">
  어떤 질문에 대해 이야기 해보고 싶은지 편하게 선택해주세요.
</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 items-stretch">
          {questions.map((q) => (
            <div key={q.id} className="h-full">
              <Button
                onClick={() => onToggle(q.id)}
                className={`flex h-[96px] w-full items-center justify-start text-left text-base sm:text-lg gap-3 px-5 sm:px-6 py-4 sm:py-5 rounded-lg border-2 transition-colors ${
                  selected.includes(q.id)
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-800 border-gray-300 hover:border-purple-600'
                }`}
              >
                {selected.includes(q.id) ? (
                  <CheckSquare className="w-6 h-6 mt-0.5 flex-shrink-0" />
                ) : (
                  <Square className="w-6 h-6 mt-0.5 flex-shrink-0" />
                )}
                <span
                  className="leading-relaxed font-medium whitespace-pre-line break-words"
                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}
                >
                  {q.keyword}
                </span>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <Button
            onClick={onStart}
            className="w-full h-14 rounded-[12px] bg-[#0052CC] hover:bg-[#0A53BE] text-white text-xl font-bold"
            disabled={selected.length === 0}
          >
            질문 시작하기
          </Button>
          <Button
            onClick={() => (window.location.href = '/')} 
            variant="outline"
            className="w-full h-14 rounded-[12px] border-[#CC3333] text-[#CC3333] hover:bg-red-50"
          >
            그만하기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}





