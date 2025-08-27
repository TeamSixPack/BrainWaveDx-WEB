import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { 
  AssessmentStorageService, 
  type StoredAssessment, 
  type AssessmentStats
} from "@/lib/assessment-storage";
import { 
  Brain,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  Target,
  Activity,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Trash2
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function AssessmentHistory() {
  const [assessments, setAssessments] = useState<StoredAssessment[]>([]);
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = () => {
    const allAssessments = AssessmentStorageService.getAllAssessments();
    const assessmentStats = AssessmentStorageService.getAssessmentStats();
    setAssessments(allAssessments);
    setStats(assessmentStats);
  };

  const handleDeleteAssessment = (id: string) => {
    if (confirm('이 검사 기록을 삭제하시겠습니까?')) {
      AssessmentStorageService.deleteAssessment(id);
      loadAssessments();
      setSelectedAssessments([]);
    }
  };

  // 비교 기능 제거

  const toggleAssessmentSelection = (id: string) => {
    setSelectedAssessments(prev => {
      if (prev.includes(id)) {
        return prev.filter(assessmentId => assessmentId !== id);
      } else if (prev.length < 2) {
        return [...prev, id];
      } else {
        return [prev[1], id]; // 최대 2개만 선택 가능
      }
    });
  };

  const getDiagnosisInfo = (diagnosis: string) => {
    switch (diagnosis) {
      case "normal":
        return {
          title: "정상",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          icon: CheckCircle
        };
      case "mci":
        return {
          title: "경도인지장애",
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          icon: AlertTriangle
        };
      case "dementia":
        return {
          title: "치매 가능성",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          icon: AlertCircle
        };
      default:
        return {
          title: "알 수 없음",
          color: "text-blue-600",
                     bgColor: "bg-white",
          borderColor: "border-gray-200",
          icon: Brain
        };
    }
  };

  const formatScoreChange = (value: number) => {
    if (value > 0) {
      return { icon: TrendingUp, color: "text-green-600", text: `+${value}` };
    } else if (value < 0) {
      return { icon: TrendingDown, color: "text-red-600", text: `${value}` };
    } else {
      return { icon: Minus, color: "text-blue-600", text: "0" };
    }
  };

  // 샘플 데이터 (예시 표시용)
  const sampleTrendData = [
    { date: "1월10일", eeg: 80, moca: 22, mmse: 27 },
    { date: "2월15일", eeg: 65, moca: 20, mmse: 24 },
    { date: "3월20일", eeg: 85, moca: 23, mmse: 28 },
    { date: "4월2일",  eeg: 70, moca: 21, mmse: 25 },
    { date: "5월8일",  eeg: 90, moca: 24, mmse: 29 },
    { date: "6월12일", eeg: 75, moca: 22, mmse: 26 },
    { date: "7월3일",  eeg: 95, moca: 25, mmse: 30 },
  ];

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
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">NeuroScan</span>
            </div>
          </div>

        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        



        {/* Progress Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>검사 점수 추이</span>
            </CardTitle>
            <CardDescription>
              날짜별 검사 점수 변화를 한눈에 확인할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full px-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sampleTrendData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="eeg" name="뇌파 점수" stroke="#3b82f6" dot />
                  <Line type="monotone" dataKey="moca" name="MOCA 점수(0~30)" stroke="#10b981" dot />
                  <Line type="monotone" dataKey="mmse" name="MMSE 점수(0~30)" stroke="#f59e0b" dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Tabs removed: comparison not used */}

          <div className="space-y-6">
            {/* Selection Controls (comparison removed) */}
            {selectedAssessments.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">{selectedAssessments.length}개 검사가 선택됨</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedAssessments([])}
                      >
                        선택 해제
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assessment List */}
            <div className="space-y-3 sm:space-y-4">
              {assessments.map((assessment, index) => {
                const diagnosisInfo = getDiagnosisInfo(assessment.diagnosis);
                const isSelected = selectedAssessments.includes(assessment.id);
                
                return (
                  <Card 
                    key={assessment.id} 
                                                              className={`cursor-pointer transition-colors hover:shadow-sm ${
                       isSelected ? 'ring-2 ring-primary bg-primary/5' : index % 2 === 0 ? 'bg-white' : 'bg-blue-50'
                     }`}
                    onClick={() => toggleAssessmentSelection(assessment.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 ${diagnosisInfo.bgColor} rounded-full flex items-center justify-center`}>
                            <diagnosisInfo.icon className={`h-6 w-6 ${diagnosisInfo.color}`} />
                          </div>
                          <div>
                            <CardTitle className="flex items-center space-x-2">
                              <span>검사 #{assessments.length - index}</span>
                              <Badge variant="outline" className={diagnosisInfo.color}>
                                {diagnosisInfo.title}
                              </Badge>
                              {index === 0 && (
                                <Badge variant="default">최신</Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="flex items-center space-x-2 mt-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(assessment.assessmentDate).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>신뢰도 {assessment.confidenceLevel}%</span>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">MOCA 점수</p>
                          <div className="flex items-center space-x-2">
                             {(assessment as any).cognitiveTest?.mocaScore && (assessment as any).cognitiveTest.mocaScore > 0 ? (
                              <>
                                <span className="text-xl font-bold text-primary">
                                   {(assessment as any).cognitiveTest.mocaScore}
                                </span>
                                <span className="text-sm text-muted-foreground">/24</span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">검사 미완료</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">결과</p>
                          <div className="text-sm text-muted-foreground">
                            {assessment.riskFactors.mciRisk < 20 ? '정상' : 
                             assessment.riskFactors.mciRisk < 50 ? '전측두엽장애' : '치매'}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">MMSE 점수</p>
                          <div className="flex items-center space-x-2">
                             {(assessment as any).cognitiveTest?.mmseScore && (assessment as any).cognitiveTest.mmseScore > 0 ? (
                              <>
                                <span className="text-xl font-bold text-primary">
                                   {(assessment as any).cognitiveTest.mmseScore}
                                </span>
                                <span className="text-sm text-muted-foreground">/23</span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">검사 미완료</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Comparison removed */}
        </div>

        {/* Action Buttons */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button asChild>
                <Link to="/assessment">
                  <Activity className="h-4 w-4 mr-2" />
                  새로운 검사 시작
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/results">
                  <Target className="h-4 w-4 mr-2" />
                  최신 결과 보기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}