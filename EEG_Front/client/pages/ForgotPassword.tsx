import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Brain, ArrowLeft } from "lucide-react";
import { findPassword } from "@/lib/api";

export default function ForgotPassword() {
  const [phone, setPhone] = useState("");
  const [passwordFound, setPasswordFound] = useState(false);
  const [userPassword, setUserPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFindPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      alert("휴대폰 번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await findPassword(phone, true);
      
      if (result.success && result.data) {
        setUserPassword(result.data.tempPassword);
        setUserName(result.data.user.name);
        // 백엔드가 id도 반환함
        // result.data.user.id가 존재하면 상태에 반영
        // (타입 보정)
        const anyUser: any = (result.data as any).user;
        if (anyUser && anyUser.id) {
          setUserId(anyUser.id as string);
        }
        setPasswordFound(true);
      } else {
        alert(result.message || "비밀번호 찾기에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("비밀번호 찾기 실패:", error);
      alert(error.message || "비밀번호 찾기에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPasswordFound(false);
    setPhone("");
    setUserPassword("");
    setUserName("");
    setUserId("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9]">
      <div className="w-full max-w-md lg:max-w-lg space-y-5">
        {/* Header */}
        <div className="text-center space-y-4">
          <Button variant="ghost" size="default" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="h-5 w-5 mr-2" />
              로그인으로 돌아가기
            </Link>
          </Button>

          <div className="flex items-center justify-center space-x-2">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
              <Brain className="h-10 w-10 text-primary" />
              <span className="text-2xl font-bold text-foreground">NeuroScan</span>
            </Link>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">비밀번호 찾기</h1>
            <p className="text-base text-muted-foreground leading-relaxed">가입 시 등록한 휴대폰 번호를 입력하면 비밀번호를 확인할 수 있습니다</p>
          </div>
        </div>

        {/* Password Recovery Card */}
        <Card>
          <CardHeader>
            <CardTitle>비밀번호 찾기 (휴대폰 번호)</CardTitle>
            <CardDescription>가입 시 등록한 휴대폰 번호를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent>
            {!passwordFound ? (
              <form onSubmit={handleFindPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="phone">휴대폰 번호</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="예: 01012345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={11}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" size="default" className="w-full" disabled={isLoading}>
                  {isLoading ? "비밀번호 찾는 중..." : "비밀번호 찾기"}
                </Button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-green-800 mb-2">비밀번호를 찾았습니다!</h3>
                      <p className="text-base text-green-700">
                        {userName}님의 비밀번호입니다
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {userId && (
                        <div>
                          <Label htmlFor="foundUserId">아이디</Label>
                          <Input id="foundUserId" value={userId} readOnly className="bg-white border border-gray-200 text-base" />
                        </div>
                      )}
                      <Label htmlFor="tempPassword">비밀번호</Label>
                      <div className="relative">
                        <Input
                          id="tempPassword"
                          type="password"
                          value={userPassword}
                          readOnly
                          className="bg-white border border-gray-200 font-mono text-base"
                        />
                      </div>
                      <p className="text-sm text-green-600 font-medium">이 비밀번호로 로그인하세요.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="default" className="flex-1" onClick={() => {
                    try {
                      if (userId) sessionStorage.setItem('prefillUsername', userId);
                      if (userPassword) sessionStorage.setItem('prefillPassword', userPassword);
                      sessionStorage.setItem('openLoginModal', '1');
                      sessionStorage.setItem('autoSubmitLogin', '1');
                    } catch {}
                  }} asChild>
                    <Link to="/">로그인하기</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="default" 
                    onClick={handleReset}
                    className="flex-1"
                  >
                    다시 찾기
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                계정이 없으신가요?{" "}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  회원가입
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
