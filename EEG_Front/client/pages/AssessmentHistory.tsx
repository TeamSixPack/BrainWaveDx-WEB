import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";
import styles from "./AssessmentHistoryButton.module.css";
import { 
  Brain,
  Calendar,
  ArrowLeft,
  Target,
  Activity,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Trash2,
  TrendingUp
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/lib/auth-context";

// 백엔드 API에서 가져올 검사 기록 타입
interface AssessmentRecord {
  id: number;
  assessmentDate: string;
  eegResult: string;
  mocaScore: number | null;
  mmseScore: number | null;
  createdAt: string;
  user: {
    uid: string;
    name: string;
  };
}

export default function AssessmentHistory() {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  console.log('🔍 AssessmentHistory - user 정보:', user);
  console.log('🔍 AssessmentHistory - isLoggedIn:', isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
    loadAssessments();
  }, [isLoggedIn, navigate]);

  // assessments 배열이 변경될 때마다 순서 확인
  useEffect(() => {
    if (assessments.length > 0) {
      console.log('🔍 assessments 배열 변경됨:');
      assessments.forEach((assessment, index) => {
        console.log(`  ${index + 1}번째: ID=${assessment.id}, 날짜=${assessment.assessmentDate}, 결과=${assessment.eegResult}`);
      });
    }
  }, [assessments]);

  // 검사 기록 로드
  const loadAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 검사 기록 로드 시작...');
      
      if (!user?.uid) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }
      
      const response = await fetch(`${API_BASE_URL}/api/assessments/user/${user.uid}`);
      console.log('🔍 API 응답 상태:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 응답 오류:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ 오류 상세 정보:', errorData);
          
          if (errorData.message) {
            throw new Error(errorData.message);
          } else {
            throw new Error(`검사 기록을 불러오는데 실패했습니다. (${response.status})`);
          }
        } catch (parseError) {
          throw new Error(`검사 기록을 불러오는데 실패했습니다. (${response.status}): ${errorText}`);
        }
      }
      
      const data = await response.json();
      console.log('🔍 API 응답 데이터:', data);
      
      // 백엔드에서 받은 데이터를 createdAt 기준으로 강제 정렬 (JSON 직렬화 문제 방지)
      console.log('🔍 백엔드에서 받은 검사 기록:', data);
      
      // 데이터 정렬 순서 확인을 위한 상세 로그
      if (Array.isArray(data) && data.length > 0) {
        console.log('🔍 백엔드에서 받은 원본 데이터 순서:');
        data.forEach((record: any, index: number) => {
          console.log(`  ${index + 1}번째: ID=${record.id}, createdAt=${record.createdAt}, assessmentDate=${record.assessmentDate}`);
        });
        
        // 프론트엔드에서 createdAt 기준으로 강제 정렬
        console.log('🔍 프론트엔드에서 createdAt 기준 강제 정렬 시작');
        const sortedData = [...data].sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA; // 최신순 (내림차순)
        });
        
        console.log('🔍 강제 정렬 후 데이터 순서:');
        sortedData.forEach((record: any, index: number) => {
          console.log(`  ${index + 1}번째: ID=${record.id}, createdAt=${record.createdAt}, assessmentDate=${record.assessmentDate}`);
        });
        
        // 정렬된 데이터 사용
        setAssessments(sortedData);
      } else {
        setAssessments(data);
      }
      
    } catch (error: any) {
      console.error('❌ 검사 기록 로드 에러:', error);
      setError(error.message || '검사 기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (id: number) => {
    if (confirm('이 검사 기록을 삭제하시겠습니까?')) {
      try {
        console.log('🔍 검사 기록 삭제 시작: ID =', id);
        
        const response = await fetch(`${API_BASE_URL}/api/assessments/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('🔍 삭제 API 응답 상태:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ 삭제 API 응답 오류:', errorText);
          throw new Error(`검사 기록 삭제에 실패했습니다. (${response.status})`);
        }
        
        const data = await response.json();
        console.log('🔍 삭제 API 응답 데이터:', data);
        
        if (data.success) {
          // 프론트엔드에서도 제거
          setAssessments(prev => prev.filter(assessment => assessment.id !== id));
          console.log('✅ 검사 기록 삭제 완료: ID =', id);
          alert('검사 기록이 삭제되었습니다.');
        } else {
          throw new Error(data.message || '검사 기록 삭제에 실패했습니다.');
        }
        
      } catch (error) {
        console.error('❌ 검사 기록 삭제 에러:', error);
        alert('검사 기록 삭제에 실패했습니다: ' + error.message);
      }
    }
  };



  const getDiagnosisInfo = (eegResult: string) => {
    switch (eegResult.toLowerCase()) {
      case "정상":
        return {
          title: "정상",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          icon: CheckCircle
        };
      case "전측두엽장애":
        return {
          title: "전측두엽장애",
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          icon: AlertTriangle
        };
      case "치매":
        return {
          title: "치매",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          icon: AlertCircle
        };
      default:
        return {
          title: eegResult || "알 수 없음",
          color: "text-blue-600",
          bgColor: "bg-white",
          borderColor: "border-gray-200",
          icon: Brain
        };
    }
  };

  // 그래프용 데이터 준비
  const prepareChartData = () => {
    return assessments
      .sort((a, b) => new Date(a.createdAt || a.assessmentDate).getTime() - new Date(b.createdAt || b.assessmentDate).getTime())
      .map((assessment, index) => {
        const date = new Date(assessment.createdAt || assessment.assessmentDate);
        let resultValue = 0;
        
        switch (assessment.eegResult?.toLowerCase()) {
          case "정상":
            resultValue = 2;
            break;
          case "치매":
            resultValue = 1;
            break;
          default:
            resultValue = 0;
        }
        
        return {
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          result: resultValue,
          fullDate: date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }),
          diagnosis: assessment.eegResult
        };
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9]">
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                뒤로 가기
              </Button>
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">검사 기록</span>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 sm:py-16 text-center">
          <div className="max-w-md mx-auto">
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-bold text-foreground mb-4">검사 기록을 불러오는 중...</h2>
            <p className="text-muted-foreground">잠시만 기다려주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9]">
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                뒤로 가기
              </Button>
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">검사 기록</span>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 sm:py-16 text-center">
          <div className="max-w-md mx-auto">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-4">오류가 발생했습니다</h2>
            <p className="text-muted-foreground mb-8">{error}</p>
            <Button onClick={loadAssessments}>
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9]">
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                뒤로 가기
              </Button>
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">검사 기록</span>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 sm:py-16 text-center">
          <div className="max-w-md mx-auto">
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-4">검사 기록이 없습니다</h2>
            <p className="text-muted-foreground mb-8">
              첫 번째 뇌 건강 검사를 받아보세요. 검사 결과가 여기에 저장됩니다.
            </p>
            <Button asChild>
              <Link to="/assessment">
                <Activity className="h-4 w-4 mr-2" />
                첫 검사 시작하기
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9] pb-24">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로 가기
            </Button>
            <div className="flex items-center space-x-2">
              <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
                <Brain className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">NeuroScan</span>
              </Link>
              <span className="text-xl font-bold text-foreground">검사 기록</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <div className="space-y-6">
          <div className="space-y-6">
            

            
            {/* 결과 변화 그래프 */}
            {assessments.length > 1 && (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>검사 결과 변화 추이</span>
                  </CardTitle>
                  <CardDescription>
                    시간에 따른 뇌 건강 상태 변화를 확인할 수 있습니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prepareChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value, index) => {
                            const data = prepareChartData();
                            return data[index]?.fullDate || value;
                          }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            switch (value) {
                              case 2: return "정상";
                              case 1: return "치매";
                              default: return "";
                            }
                          }}
                          domain={[0, 2]}
                          ticks={[1, 2]}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            const data = prepareChartData();
                            const index = data.findIndex(item => item.result === value);
                            return [data[index]?.diagnosis || "알 수 없음", "진단 결과"];
                          }}
                          labelFormatter={(label) => `검사일: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="result" 
                          name="측정결과"
                          stroke="#2563eb" 
                          strokeWidth={3}
                          dot={{ fill: "#2563eb", strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, stroke: "#2563eb", strokeWidth: 2, fill: "#ffffff" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assessment List */}
            <div className="space-y-3 sm:space-y4">
              {(() => {
                console.log('🔍 렌더링 시 assessments 배열:', assessments);
                console.log('🔍 렌더링 시 첫 번째 데이터:', assessments[0]);
                console.log('🔍 렌더링 시 마지막 데이터:', assessments[assessments.length - 1]);
                return null;
              })()}
              {assessments.map((assessment, index) => {
                const diagnosisInfo = getDiagnosisInfo(assessment.eegResult);
                
                console.log(`🔍 렌더링 ${index}번째: ID=${assessment.id}, 날짜=${assessment.assessmentDate}`);
                
                return (
                  <Card 
                    key={assessment.id} 
                    className="bg-white transition-colors hover:shadow-sm"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 ${diagnosisInfo.bgColor} rounded-full flex items-center justify-center`}>
                            <diagnosisInfo.icon className={`h-6 w-6 ${diagnosisInfo.color}`} />
                          </div>
                          <div>
                            <CardTitle className="flex items-center space-x-2">
                              <span>검사 #{assessment.id}</span>
                            </CardTitle>
                            <CardDescription className="flex items-center space-x-2 mt-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(assessment.assessmentDate).toLocaleString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}</span>
                              <span>•</span>
                              <span>{assessment.user?.name || '사용자'}</span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAssessment(assessment.id);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-8">
                        <div className="space-y-2">
                          <p className="text-base font-semibold text-muted-foreground">결과</p>
                          <p className="text-lg font-bold">{assessment.eegResult}</p>
                        </div>
                        <div className="space-y-2 text-center">
                          <p className="text-base font-semibold text-muted-foreground">종합 인지 검사 점수</p>
                          {assessment.mocaScore !== null && assessment.mocaScore > 0 ? (
                            <p className="text-lg font-bold">{assessment.mocaScore}/30</p>
                          ) : (
                            <p className="text-base text-muted-foreground italic">검사 미완료</p>
                          )}
                        </div>
                        <div className="space-y-2 text-center">
                          <p className="text-base font-semibold text-muted-foreground">간이 인지 검사 점수</p>
                          {assessment.mmseScore !== null && assessment.mmseScore > 0 ? (
                            <p className="text-lg font-bold">{assessment.mmseScore}/30</p>
                          ) : (
                            <p className="text-base text-muted-foreground italic">검사 미완료</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}