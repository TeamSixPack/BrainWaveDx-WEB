import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { 
  Brain,
  MessageCircle,
  FileText,
  ArrowLeft,
  Calendar,
  Activity,
  TrendingUp,
  Clock,
  User
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import styles from "./RecordSelection.module.css";
import "./RecordSelection.css";

export default function RecordSelection() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  if (!isLoggedIn) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
                 {/* 헤더 */}
         <div className="flex flex-col items-center mb-8">
           <div className="flex items-center justify-between w-full mb-4">
             <Button
               variant="outline"
               size="sm"
               onClick={() => navigate(-1)}
               className="flex items-center space-x-2"
             >
               <ArrowLeft className="h-4 w-4" />
               뒤로가기
             </Button>
           </div>
           <div className="text-center">
             <h1 className="text-3xl font-bold text-gray-900">검사 기록 보기</h1>
             <p className="text-gray-600 mt-2">어떤 검사 기록을 확인하시겠습니까?</p>
           </div>
         </div>

                 {/* 선택 카드들 */}
         <div className="flex justify-center items-center min-h-[60vh]">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          {/* 뇌파 검사 기록 */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
            <Link to="/assessment-history" className={`block ${styles.noUnderline}`} style={{ textDecoration: 'none !important', textDecorationLine: 'none !important', textDecorationStyle: 'none !important', textDecorationColor: 'transparent !important' }}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">뇌파 검사 기록</CardTitle>
                <CardDescription className="text-gray-600">
                  뇌파 검사 결과와 인지 기능 검사 기록을 확인할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Activity className="h-4 w-4" />
                    <span>뇌파 분석</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>점수 추이</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>검사 일정</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>진행 시간</span>
                  </div>
                </div>
                <div className="pt-4">
                  <Button className="w-full" size="lg">
                    뇌파 검사 기록 보기
                  </Button>
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* 음성 상담 기록 */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
            <Link to="/voice-consultation-history" className={`block ${styles.noUnderline}`} style={{ textDecoration: 'none !important', textDecorationLine: 'none !important', textDecorationStyle: 'none !important', textDecorationColor: 'transparent !important' }}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <MessageCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">음성 상담 기록</CardTitle>
                <CardDescription className="text-gray-600">
                  AI 음성 챗봇과의 상담 내용과 분석 결과를 확인할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>원본 음성</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MessageCircle className="h-4 w-4" />
                    <span>AI 요약</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>상담 일시</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span>사용자</span>
                  </div>
                </div>
                                 <div className="pt-4">
                   <Button className="w-full" size="lg">
                     음성 상담 기록 보기
                   </Button>
                 </div>
              </CardContent>
            </Link>
          </Card>
                   </div>
         </div>
       </div>
    </div>
  );
}
