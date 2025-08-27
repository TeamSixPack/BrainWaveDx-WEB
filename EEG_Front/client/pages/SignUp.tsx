import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Brain, ArrowLeft, Lock, User, UserCheck } from "lucide-react";
import { signup, checkIdDuplicate } from "@/lib/api";

export default function SignUp() {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [acceptTerms, setAcceptTerms] = useState(false); // 명확하게 false로 시작
  const [isLoading, setIsLoading] = useState(false);
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [idCheckLoading, setIdCheckLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 아이디 변경 시 중복 확인 상태 초기화
    if (name === 'username') {
      setIsIdChecked(false);
    }
  };

  // 전화번호 입력 (숫자만)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자만 입력받기
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, phone: value }));
  };

  // 아이디 중복 확인
  const handleIdCheck = async () => {
    if (!formData.username) {
      alert('아이디를 입력해주세요.');
      return;
    }
    
    if (!/^[a-zA-Z0-9]{4,20}$/.test(formData.username)) {
      alert('아이디는 4~20자의 영문과 숫자만 사용 가능합니다.');
      return;
    }

    setIdCheckLoading(true);
    
    try {
      console.log('아이디 중복확인 시작:', formData.username);
      const isDuplicate = await checkIdDuplicate(formData.username);
      console.log('중복확인 결과:', isDuplicate);
      
      if (isDuplicate) {
        alert('이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.');
        setFormData(prev => ({ ...prev, username: '' }));
        setIsIdChecked(false);
      } else {
        alert('사용 가능한 아이디입니다.');
        setIsIdChecked(true);
      }
    } catch (error) {
      console.error('아이디 중복 확인 상세 오류:', error);
      alert('아이디 중복 확인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIdCheckLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!isIdChecked) {
      alert("아이디 중복 확인을 해주세요");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다");
      return;
    }
    
    if (formData.password.length < 4) {
      alert("비밀번호는 4자리 이상 입력해주세요");
      return;
    }
    
    if (!acceptTerms) {
      alert("이용약관에 동의해 주세요");
      return;
    }

    setIsLoading(true);
    
    try {
      const signupData = {
        id: formData.username,
        pw: formData.password,
        name: formData.name,
        phone: formData.phone
      };
      
      const result = await signup(signupData);
      
      if (result.success) {
        alert("회원가입이 완료되었습니다!");
        // 로그인 페이지로 이동
        window.location.href = '/';
      } else {
        alert(result.message || "회원가입에 실패했습니다.");
      }
      
    } catch (error: any) {
      console.error("회원가입 실패:", error);
      alert(error.message || "회원가입에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9]">
      <div className="w-full max-w-md lg:max-w-lg space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">


          <div className="flex items-center justify-center space-x-2">
            <Brain className="h-12 w-12 text-primary" />
            <span className="text-3xl font-bold text-foreground">NeuroScan</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">회원가입</h1>
          </div>
        </div>

        {/* Sign Up Card */}
        <Card>
          <CardHeader>

          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-5">
              {/* 아이디 */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-lg font-semibold">아이디</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="4~20자 영문, 숫자"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="h-12 text-lg"
                      required
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="default"
                    onClick={handleIdCheck}
                    className="whitespace-nowrap h-12 px-4 w-full sm:w-auto text-lg"
                    disabled={idCheckLoading}
                  >
                    {idCheckLoading ? "확인 중..." : "중복확인"}
                  </Button>
                </div>
                {isIdChecked && (
                  <p className="text-base text-green-600 font-medium">✓ 사용 가능한 아이디입니다</p>
                )}
                {!isIdChecked && formData.username.length > 0 && (
                  <p className="text-sm text-red-600">아이디 중복 확인을 진행해 주세요</p>
                )}
              </div>

              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-lg font-semibold">이름</Label>
                <div className="relative">
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="실명을 입력하세요"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="h-12 text-lg"
                    required
                  />
                </div>
              </div>

              {/* 전화번호 */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-lg font-semibold">전화번호</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="01012345678"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="h-12 text-lg"
                    maxLength={11}
                    required
                  />
                </div>
                {formData.phone.length > 0 && formData.phone.length < 10 && (
                  <p className="text-sm text-red-600">숫자만 입력해 주세요 (10~11자리)</p>
                )}
              </div>

              {/* 비밀번호 */}
              <div className="space-y-3">
                <Label htmlFor="password" className="text-lg font-semibold">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="4자리 이상 입력"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="h-12 text-lg"
                    required
                  />
                </div>
                {formData.password.length > 0 && formData.password.length < 4 && (
                  <p className="text-sm text-red-600">비밀번호는 4자리 이상이어야 합니다</p>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-lg font-semibold">비밀번호 확인</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="h-12 text-lg"
                    required
                  />
                </div>
                {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-red-600">비밀번호가 일치하지 않습니다</p>
                )}
              </div>

              {/* 이용약관 동의 */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  {/* 커스텀 체크박스 (button 대신 span 사용하여 전역 버튼 스타일 회피) */}
                  <span
                    role="checkbox"
                    aria-checked={acceptTerms}
                    tabIndex={0}
                    onClick={() => setAcceptTerms(!acceptTerms)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setAcceptTerms(!acceptTerms);
                      }
                    }}
                    className="custom-checkbox"
                  >
                    {acceptTerms && (
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style={{ color: '#1f2937' } as React.CSSProperties}
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                  <div className="flex-1 min-w-0 text-left sm:text-center">
                    <Label
                      className="text-base text-foreground cursor-pointer leading-relaxed block"
                      onClick={() => setAcceptTerms(!acceptTerms)}
                    >
                      저는{" "}
                      <Link to="/terms" className="text-primary hover:underline font-medium">
                        서비스 이용약관
                      </Link>{" "}
                      및{" "}
                      <Link to="/privacy" className="text-primary hover:underline font-medium">
                        개인정보 처리방침
                      </Link>
                      에 동의합니다
                    </Label>
                  </div>
                </div>
              </div>

              {/* 회원가입 버튼 */}
              <Button type="submit" size="default" className="w-full h-12 text-lg" disabled={isLoading}>
                {isLoading ? "계정 생성 중..." : "계정 만들기"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-base text-muted-foreground">
                이미 계정이 있으신가요?{" "}
                <Link to="/" className="text-primary hover:underline font-medium">
                  로그인하기
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
