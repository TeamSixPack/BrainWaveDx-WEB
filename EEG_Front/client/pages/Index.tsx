import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Brain, Upload, Zap, FileText, Lock, Eye, EyeOff, LogIn, UserPlus, LogOut, User, UserCheck, X, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { login, changePassword } from "@/lib/api";
import MemoryChatbot from "@/components/MemoryChatbot";

export default function Index() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isLoggedIn, login: authLogin, logout } = useAuth();
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [lastLoginPassword, setLastLoginPassword] = useState("");
  const [memoryChatbotOpen, setMemoryChatbotOpen] = useState(false);

  const performLogin = async (uid: string, pw: string) => {
    setIsLoading(true);
    try {
      const result = await login({ id: uid, pw });
      if (result.success && result.user) {
        authLogin(result.user);
        setLoginModalOpen(false);
        setUsername("");
        setPassword("");
        setLastLoginPassword(pw);
        alert("로그인에 성공했습니다!");
        return true;
      } else {
        alert(result.message || "로그인에 실패했습니다.");
        return false;
      }
    } catch (error: any) {
      alert(error.message || "로그인 중 오류가 발생했습니다.");
      console.error("로그인 오류:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(username, password);
  };

  // 비밀번호 찾기에서 전달된 값으로 로그인 모달 자동 열기 및 자동 입력
  useEffect(() => {
    try {
      const open = sessionStorage.getItem('openLoginModal');
      const preU = sessionStorage.getItem('prefillUsername');
      const preP = sessionStorage.getItem('prefillPassword');
      const auto = sessionStorage.getItem('autoSubmitLogin');
      if (open === '1') {
        if (preU) setUsername(preU);
        if (preP) setPassword(preP);
        setLoginModalOpen(true);
        if (auto === '1' && preU && preP) {
          // 약간의 지연 후 자동 로그인 시도
          setTimeout(() => {
            performLogin(preU, preP);
          }, 100);
        }
        sessionStorage.removeItem('openLoginModal');
        sessionStorage.removeItem('prefillUsername');
        sessionStorage.removeItem('prefillPassword');
        sessionStorage.removeItem('autoSubmitLogin');
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#2563eb] rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#1d4ed8] rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-[#f59e0b] rounded-lg"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-background/95 backdrop-blur-sm shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <span className="text-lg sm:text-xl font-bold text-foreground">NeuroScan</span>
            </div>
            {/* 기억력 상담 챗봇 버튼 */}
            <Button 
              variant="outline" 
              size="sm"
              className="hidden sm:flex bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-200 text-blue-700 hover:text-blue-800 transition-colors duration-200"
              onClick={() => setMemoryChatbotOpen(true)}
            >
              <MessageCircle className="h-4 w-4 mr-2 group-hover:text-blue-600" />
              AI 건강 상담
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            {isLoggedIn ? (
              // 로그인된 상태: 사용자 이름과 로그아웃 버튼
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-primary" />
                  <button onClick={() => { setCurrentPw(lastLoginPassword || ""); setChangePwOpen(true); }} className="text-foreground font-semibold underline underline-offset-2">{user?.name}님 환영합니다</button>
                </div>
                <Button variant="outline" size="default" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  로그아웃
                </Button>
              </div>
            ) : (
              // 로그인되지 않은 상태: 로그인/회원가입 버튼
              <>
                <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                  <UserCheck className="h-4 w-4" />
                  <span>비회원 모드</span>
                </div>
                <Button 
                  size="default"
                  onClick={() => setLoginModalOpen(true)}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  로그인
                </Button>
                <Button variant="outline" size="default" asChild>
                                      <Link to="/signup">
                      <UserPlus className="h-4 w-4 mr-2" />
                      회원가입
                    </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="space-y-8 sm:space-y-10">
            {/* Hero Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Brain className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-primary" />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground leading-tight px-2">
                  AI 기술로 뇌 건강을 예측하세요.
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-blue-700 max-w-2xl mx-auto leading-relaxed px-4">
                  인지 기능 테스트를 통해 빠르고 쉽게 뇌 건강 상태를 확인하세요.
                </p>
                {!isLoggedIn && (
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto px-4">
                    로그인 없이도 테스트를 진행할 수 있습니다. 결과는 PDF로 다운로드 <br></br>가능하며, 
                    로그인 시 검사 기록을 저장하고 추이를 확인할 수 있습니다.
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4 sm:pt-7">
                {/* 테스트 시작하기 버튼 */}
                {isLoggedIn ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Button asChild size="lg" className="px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold text-white !text-white">
                        <Link to="/test-mode-selection" className="override-white">
                          <Brain className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          테스트 시작하기
                        </Link>
                      </Button>
                      <Button asChild size="lg" variant="secondary" className="px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold">
                        <Link to="/eeg-test">
                          <Upload className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                          뇌파 분석 테스트
                        </Link>
                      </Button>
                    </div>
                    <Button variant="outline" size="lg" asChild className="px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold">
                      <Link to="/assessment-history">
                        <FileText className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                        검사기록 보기
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Button variant="default" asChild size="lg" className="px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold w-full sm:w-64 text-white !text-white">
                        <Link to="/test-mode-selection" className="override-white">
                          <Brain className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          비회원으로 검사하기
                        </Link>
                      </Button>
                      <Button asChild size="lg" variant="secondary" className="px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold w-full sm:w-64">
                        <Link to="/eeg-test">
                          <Upload className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                          뇌파 분석 검사
                        </Link>
                      </Button>
                    </div>
                    <Button variant="outline" size="lg" onClick={() => setLoginModalOpen(true)} className="px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold w-full sm:w-64">
                      로그인하여 기록 저장
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 pt-8 sm:pt-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-md border border-white/20 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Brain className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">뇌파 기반 인지 기능 평가</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">뇌파 데이터로 정확한 인지 기능 상태를 분석합니다.</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-md border border-white/20 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">MMSE-K<br></br> 인지 검사</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">표준화된 한국형 간이정신상태검사 도구를 제공합니다.</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-md border border-white/20 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">AI 기반 맞춤<br></br> 분석</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">개인별 맞춤 분석으로 정확한 결과를 제공합니다.</p>
              </div>

              <div 
                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-white/20 hover:shadow-md transition-colors duration-200 cursor-pointer group hover:bg-blue-50 hover:border-blue-200"
                onClick={() => setMemoryChatbotOpen(true)}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/10 transition-colors duration-200">
                  <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-green-600 group-hover:text-blue-600 transition-colors duration-200" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2 group-hover:text-blue-700 transition-colors duration-200">AI 건강 상담<br></br> 챗봇</h3>
                <p className="text-xs sm:text-sm text-muted-foreground group-hover:text-blue-600 transition-colors duration-200">음성으로 상담하고 전문가 수준의 해석을 받아보세요.</p>
              </div>
            </div>

            {/* Footer Info */}
            <div className="text-center space-y-2 sm:space-y-3 pt-8 sm:pt-12">
              <p className="text-sm sm:text-base text-muted-foreground">직관적인 인지 기능 테스트</p>
              <p className="text-xs sm:text-sm text-muted-foreground italic">
                정확한 진단은 전문 의료기관에서 받으시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      </main>
      {/* 커스텀 로그인 모달 */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 오버레이 */}
          <div 
            className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm"
            onClick={() => setLoginModalOpen(false)}
          />
          
          {/* 모달 컨텐츠 */}
          <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl border border-gray-200">
            {/* 헤더 */}
            <div className="flex items-center justify-center p-3 sm:p-4 pb-2">
              <h2 className="text-lg sm:text-xl font-bold text-blue-900">로그인</h2>
            </div>
            <div className="px-4 sm:px-6 pb-3 text-center">
              <p className="text-xs sm:text-sm text-blue-600 mt-1">로그인 정보를 입력해주세요</p>
            </div>
            
            {/* 모달 바디 */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm sm:text-base font-semibold text-blue-700">아이디</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder="아이디를 입력하세요"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-10 sm:h-11 text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-semibold text-blue-700">비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                                              placeholder="비밀번호를 입력하세요"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 text-base"
                      required
                    />
                  </div>
                </div>

                {/* Login Button */}
                <Button type="submit" size="default" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                  {isLoading ? "로그인 중..." : "로그인"}
                </Button>
              </form>

              {/* Forgot Password Link */}
              <div className="pt-3 text-center">
                <Link
                  to="/forgot-password"
                  onClick={() => setLoginModalOpen(false)}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  비밀번호 찾기
                </Link>
              </div>

              {/* Sign Up Link */}
              <div className="text-center space-y-3 pt-2">
                <p className="text-sm text-blue-600">아직 계정이 없으신가요?</p>
                <Button variant="outline" size="default" asChild className="w-full h-11 text-base font-semibold">
                  <Link to="/signup" onClick={() => setLoginModalOpen(false)}>회원가입</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 모달 */}
      {changePwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm" onClick={() => setChangePwOpen(false)} />
          <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl border border-gray-200">
            <div className="flex items-center justify-center p-4 pb-2">
                                <h2 className="text-xl font-bold text-blue-900">비밀번호 변경</h2>
            </div>
            <div className="px-6 pb-6">
              <form className="space-y-5" onSubmit={async (e) => {
                e.preventDefault();
                if (!user?.id) return;
                try {
                  const res = await changePassword({ id: user.id, currentPw, newPw });
                  alert(res.message || '비밀번호가 변경되었습니다.');
                  setChangePwOpen(false);
                  setCurrentPw("");
                  setNewPw("");
                } catch (err: any) {
                  alert(err.message || '비밀번호 변경에 실패했습니다.');
                }
              }}>
                <div className="space-y-2">
                  <Label htmlFor="currentPw" className="text-base font-semibold text-blue-700">현재 비밀번호</Label>
                  <Input id="currentPw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="h-11 text-base" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPw" className="text-base font-semibold text-blue-700">새 비밀번호(4자 이상)</Label>
                  <Input id="newPw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="h-11 text-base" required minLength={4} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 h-11">변경</Button>
                  <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setChangePwOpen(false)}>취소</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* 기억력 상담 챗봇 */}
      <MemoryChatbot 
        isOpen={memoryChatbotOpen}
        onClose={() => setMemoryChatbotOpen(false)}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}