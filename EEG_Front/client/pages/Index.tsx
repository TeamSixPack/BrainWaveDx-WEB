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
      const result = await login({ uid: uid, pw });
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
    <div
      className="min-h-screen relative overflow-hidden bg-cover bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/images/mainPage.png')", backgroundPosition: "center -120px" }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#dbeafe] rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#f1f5f9] rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-[#f8fafc] rounded-lg"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-background/95 backdrop-blur-sm shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-6">
            <div className="flex items-center space-x-2">
              <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
                <Brain className="h-8 w-8 sm:h-9 sm:w-9 text-primary" />
                <span className="text-xl sm:text-2xl font-bold text-foreground">NeuroScan</span>
              </Link>
            </div>
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
      <main className="relative z-10 flex items-end justify-center min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 pb-16 sm:pb-20 lg:pb-24" style={{ paddingTop: '300px' }}>
        <div className="container mx-auto text-center max-w-5xl">
          <div className="space-y-12 sm:space-y-16">
            {/* Hero Section */}
            <div className="space-y-4 sm:space-y-6">
              {/* 상단 텍스트 영역 - 뇌 이미지 위쪽에 배치 */}
              <div className="absolute top-[200px] left-0 right-0 flex items-start justify-between w-full px-4 sm:px-8 lg:px-16 z-20">
                <div className="flex-1 text-left" style={{ paddingLeft: '200px' }}>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                    부담은 '<span className="blue-text">싹</span>' 진단은 '<span className="blue-text">딱</span>'
                  </h1>
                </div>
                <div className="flex-1 text-right" style={{ paddingRight: '200px' }}>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                    AI로 챙기는 두뇌건강
                  </h1>
                </div>
              </div>
              {!isLoggedIn && (
                <div className="login-info-text text-sm sm:text-base text-muted-foreground max-w-lg mx-auto px-4">
                </div>
              )}
              <div className="absolute top-[600px] left-1/2 transform -translate-x-1/2 flex flex-col gap-3 sm:gap-4 justify-center items-center z-20">
                {/* 테스트 시작하기 버튼 */}
                {isLoggedIn ? (
                  <div className="flex flex-col gap-3 sm:gap-4 justify-center items-center">
                    <Button asChild size="lg" className="px-6 sm:px-8 py-4 sm:py-6 text-lg sm:text-xl font-semibold text-white !text-white w-full sm:w-80">
                      <Link to="/test-mode-selection" className="override-white">
                        테스트 시작하기
                      </Link>
                    </Button>
                    {/* 뇌파 분석 테스트 버튼 제거됨 */}
                    <Button asChild size="lg" variant="outline" className="px-6 sm:px-8 py-4 sm:py-6 text-lg sm:text-xl font-semibold w-full sm:w-80">
                      <Link to="/memory-helper">
                        <MessageCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                        AI 음성챗봇
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild className="px-6 sm:px-8 py-4 sm:py-6 text-lg sm:text-xl font-semibold w-full sm:w-80">
                      <Link to="/record-selection">
                        <FileText className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                        검사기록 보기
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:gap-4 justify-center items-center">
                    <Button variant="default" asChild size="lg" className="px-6 sm:px-8 py-4 sm:py-6 text-lg sm:text-xl font-semibold w-full sm:w-80 text-white !text-white">
                      <Link to="/test-mode-selection" className="override-white">
                        비회원으로 검사하기
                      </Link>
                    </Button>
                    {/* 뇌파 분석 검사 버튼 제거됨 */}
                    <Button size="lg" variant="outline" className="px-6 sm:px-8 py-4 sm:py-6 text-lg sm:text-xl font-semibold w-full sm:w-80 opacity-50 cursor-not-allowed" disabled>
                      <MessageCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                      AI 음성챗봇 (로그인 필요)
                    </Button>
                    <Button size="lg" variant="outline" className="px-6 sm:px-8 py-4 sm:py-6 text-lg sm:text-xl font-semibold w-full sm:w-80 opacity-50 cursor-not-allowed" disabled>
                      <FileText className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                      검사기록 보기 (로그인 필요)
                    </Button>
                  </div>
                )}
              </div>
            </div>



            {/* Footer Info */}
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-center space-y-2 sm:space-y-3 z-20">
              <p className="text-sm sm:text-base text-muted-foreground italic">
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
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900">로그인</h2>
            </div>
            <div className="px-4 sm:px-6 pb-3 text-center">
              <p className="text-sm sm:text-base text-blue-600 mt-1">로그인 정보를 입력해주세요</p>
            </div>
            
            {/* 모달 바디 */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-base sm:text-lg font-semibold text-blue-700">아이디</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder="아이디를 입력하세요"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base sm:text-lg font-semibold text-blue-700">비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="비밀번호를 입력하세요"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 sm:h-14 text-base sm:text-lg"
                      required
                    />
                  </div>
                </div>

                {/* Login Button */}
                <Button type="submit" size="default" className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold" disabled={isLoading}>
                  {isLoading ? "로그인 중..." : "로그인"}
                </Button>
              </form>

              {/* Forgot Password Link */}
              <div className="pt-3 text-center">
                <Link
                  to="/forgot-password"
                  onClick={() => setLoginModalOpen(false)}
                  className="text-base sm:text-lg text-primary hover:underline font-medium"
                >
                  비밀번호 찾기
                </Link>
              </div>

              {/* Sign Up Link */}
              <div className="text-center space-y-3 pt-2">
                <p className="text-base sm:text-lg text-blue-600">아직 계정이 없으신가요?</p>
                <Button variant="outline" size="default" asChild className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold">
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
                                  if (!user?.uid) return;
                try {
                  const res = await changePassword({ uid: user.uid, currentPw, newPw });
                  alert(res.message || '비밀번호가 변경되었습니다.');
                  setChangePwOpen(false);
                  setCurrentPw("");
                  setNewPw("");
                } catch (err: any) {
                  alert(err.message || '비밀번호 변경에 실패했습니다.');
                }
              }}>
                <div className="space-y-2">
                  <Label htmlFor="currentPw" className="text-base sm:text-lg font-semibold text-blue-700">현재 비밀번호</Label>
                  <Input id="currentPw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="h-12 sm:h-14 text-base sm:text-lg" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPw" className="text-base sm:text-lg font-semibold text-blue-700">새 비밀번호(4자 이상)</Label>
                  <Input id="newPw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="h-12 sm:h-14 text-base sm:text-lg" required minLength={4} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 h-12 sm:h-14 text-base sm:text-lg">변경</Button>
                  <Button type="button" variant="outline" className="flex-1 h-12 sm:h-14 text-base sm:text-lg" onClick={() => setChangePwOpen(false)}>취소</Button>
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