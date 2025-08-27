import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Brain, Volume2, VolumeX, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function TestModeSelection() {
  const [selectedMode, setSelectedMode] = useState<'voice' | 'normal' | null>(null);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const handleModeSelect = (mode: 'voice' | 'normal') => {
    setSelectedMode(mode);
    
    // 선택한 모드를 세션에 저장
    sessionStorage.setItem('testMode', mode);
    
    // 잠시 후 테스트 시작 페이지로 이동
    setTimeout(() => {
      navigate('/assessment');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9] p-2 sm:p-3">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm mb-3 sm:mb-4">
        <div className="container mx-auto px-2 sm:px-3 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 lg:space-x-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">뒤로</span>
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
              <span className="text-base sm:text-lg lg:text-xl font-bold text-foreground">NeuroScan</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-2 sm:px-3">
        {/* Guest mode notification */}
        {!isLoggedIn && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-blue-800 mb-1">
              <span className="text-sm font-medium">게스트 모드로 진행 중</span>
            </div>
            <p className="text-xs text-blue-700 text-center px-2">
              로그인하지 않은 상태로 검사를 진행합니다. 결과는 PDF로 다운로드할 수 있지만, 
              검사 기록은 저장되지 않습니다.
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="text-center mb-4 sm:mb-5">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2 sm:mb-3">
            검사 모드를 선택하세요
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-2">
            사용자에게 가장 적합한 검사 환경을 선택해주세요
          </p>
        </div>

        {/* Mode Selection Cards - 가로로 길게 배치 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
          {/* 음성안내 모드 */}
          <Card 
            className={`cursor-pointer transition-colors duration-200 hover:shadow-md ${
              selectedMode === 'voice' 
                ? 'ring-2 ring-primary shadow-md' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleModeSelect('voice')}
          >
            <CardHeader className="text-center pb-2 sm:pb-3">
              <div className="flex justify-center mb-2 sm:mb-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Volume2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-lg sm:text-xl text-blue-600">음성안내 모드</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                모든 단계별 음성 안내가 제공됩니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 sm:space-y-2">
              <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span>모든 단계별 자동 음성 안내</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span>노인 사용자 및 음성 안내 선호자 추천</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span>천천히 편안하게 진행</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span>접근성 향상</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 일반 모드 */}
          <Card 
            className={`cursor-pointer transition-colors duration-200 hover:shadow-md ${
              selectedMode === 'normal' 
                ? 'ring-2 ring-primary shadow-md' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleModeSelect('normal')}
          >
            <CardHeader className="text-center pb-2 sm:pb-3">
              <div className="flex justify-center mb-2 sm:mb-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <VolumeX className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-lg sm:text-xl text-blue-600">일반 모드</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                빠른 진행을 위한 기본 검사 환경입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 sm:space-y-2">
              <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span>음성 안내 없음</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span>젊은 사용자 및 빠른 진행 선호자 추천</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span>집중력 향상</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span>조용한 환경에서 진행</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selection Feedback */}
        {selectedMode && (
          <div className="text-center p-3 sm:p-4 bg-white border border-gray-200 rounded-lg mb-3 sm:mb-4">
            <div className="flex items-center justify-center space-x-2 text-green-800 mb-1">
              <span className="text-base sm:text-lg font-medium">
                {selectedMode === 'voice' ? '음성안내 모드' : '일반 모드'}가 선택되었습니다
              </span>
            </div>
            <p className="text-sm sm:text-base text-green-700">
              잠시 후 검사 시작됩니다...
            </p>
          </div>
        )}

        {/* Additional Info */}
        <div className="p-3 bg-white border border-gray-200 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-blue-700">
              검사 중에는 모드를 변경할 수 없습니다. 
              처음부터 다시 시작하려면 뒤로가기를 눌러주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
