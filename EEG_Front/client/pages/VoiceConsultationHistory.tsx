import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { 
  MessageCircle,
  Calendar,
  ArrowLeft,
  User,
  Clock,
  Trash2,
  FileText,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// 백엔드 API에서 가져올 음성 상담 기록 타입
interface VoiceConsultationRecord {
  id: number;
  rawData: string;
  aiSummary: string;
  uid: string;
  username: string;
  createdAt: string;
}

export default function VoiceConsultationHistory() {
  const [consultations, setConsultations] = useState<VoiceConsultationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedConsultation, setExpandedConsultation] = useState<number | null>(null);
  
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
    loadConsultations();
  }, [isLoggedIn, navigate]);



  // 음성 상담 기록 로드
  const loadConsultations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.uid) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }
      
      const response = await fetch(`http://localhost:8090/api/voice-consultation/user/${user.uid}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 응답 오류:', errorText);
        throw new Error(`음성 상담 기록을 불러오는데 실패했습니다. (${response.status})`);
      }
      
      const data = await response.json();
      console.log('백엔드에서 받은 음성 상담 기록:', data);
      
      // 날짜별로 정렬 (최신순)
      const sortedConsultations = data.sort((a: VoiceConsultationRecord, b: VoiceConsultationRecord) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setConsultations(sortedConsultations);
      
    } catch (error: any) {
      console.error('음성 상담 기록 로드 오류:', error);
      setError(error.message || '음성 상담 기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상담 기록 삭제
  const deleteConsultation = async (id: number) => {
    if (!confirm('정말로 이 상담 기록을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8090/api/voice-consultation/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 삭제 성공 시 목록에서 제거
              setConsultations(prev => prev.filter(consultation => consultation.id !== id));
        alert('상담 기록이 삭제되었습니다.');
      } else {
        throw new Error('삭제에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('상담 기록 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 상담 기록 확장/축소 토글
  const toggleConsultation = (id: number) => {
    setExpandedConsultation(expandedConsultation === id ? null : id);
  };

  // 텍스트 길이 제한
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // 항상 memory-helper로 이동
                navigate('/memory-helper');
              }}
              className="flex items-center space-x-2 border-blue-force"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로가기
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">음성 상담 기록</h1>
              <p className="text-gray-600 mt-2">이전에 진행한 음성 상담 기록들을 확인할 수 있습니다.</p>
            </div>
          </div>
        </div>



        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">음성 상담 기록을 불러오는 중...</p>
          </div>
        )}

        {/* 오류 상태 */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <AlertTriangle className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadConsultations} variant="outline" className="border-blue-force">
              다시 시도
            </Button>
          </div>
        )}

        {/* 상담 기록 목록 */}
        {!loading && !error && (
          <div className="space-y-6">
            {consultations.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">상담 기록이 없습니다</h3>
                <p className="text-gray-500">첫 번째 음성 상담을 진행해보세요!</p>
                <Button 
                  onClick={() => navigate('/memory-helper')} 
                  className="mt-4"
                  size="lg"
                >
                  음성 상담 시작하기
                </Button>
              </div>
            ) : (
              consultations.map((consultation) => (
                <Card 
                  key={consultation.id} 
                  className={`shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                    expandedConsultation === consultation.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => toggleConsultation(consultation.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MessageCircle className="h-6 w-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">음성 상담 #{consultation.id}</CardTitle>
                          <CardDescription className="flex items-center space-x-4 mt-2">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(consultation.createdAt)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{consultation.username || '사용자'}</span>
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          음성 상담
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConsultation(consultation.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-force"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                                     {/* 축소된 상태 - 원본만 간단하게 표시 */}
                   {expandedConsultation !== consultation.id && (
                     <CardContent className="space-y-3">
                       <div className="bg-gray-50 p-3 rounded-lg">
                         <div className="flex items-center space-x-2 mb-2">
                           <FileText className="h-4 w-4 text-gray-500" />
                           <span className="text-sm font-medium text-gray-600">원본 음성 내용</span>
                         </div>
                         <p className="text-gray-800 text-sm leading-relaxed">
                           {truncateText(consultation.rawData, 100)}
                         </p>
                       </div>
                       <div className="text-center">
                         <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 border-blue-force">
                           클릭하여 전체 내용 보기
                         </Button>
                       </div>
                     </CardContent>
                   )}
                  
                  {/* 확장된 상태 - 전체 내용 표시 */}
                  {expandedConsultation === consultation.id && (
                    <CardContent className="space-y-4">
                      {/* 원본 음성 데이터 */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>원본 음성 내용</span>
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-800 whitespace-pre-wrap">
                            {consultation.rawData}
                          </p>
                        </div>
                      </div>

                      {/* AI 요약 */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                          <MessageCircle className="h-4 w-4" />
                          <span>AI 분석 요약</span>
                        </h4>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-blue-900 whitespace-pre-wrap">
                            {consultation.aiSummary}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" className="text-gray-600 border-blue-force">
                          클릭하여 축소하기
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* 통계 정보 */}
        {!loading && !error && consultations.length > 0 && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">상담 통계</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{consultations.length}</div>
                <div className="text-sm text-gray-600">총 상담 횟수</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {consultations.length > 0 ? 
                    formatDate(consultations[0].createdAt).split(' ')[0] : '없음'
                  }
                </div>
                <div className="text-sm text-gray-600">최근 상담일</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {consultations.length > 0 ? 
                    formatDate(consultations[consultations.length - 1].createdAt).split(' ')[0] : '없음'
                  }
                </div>
                <div className="text-sm text-gray-600">첫 상담일</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
