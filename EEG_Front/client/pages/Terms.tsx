import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-6">
          <Link to="/signup">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              회원가입으로 돌아가기
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">서비스 이용약관</CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              시행일자: 2024년 1월 1일
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-3">제1조 (목적)</h3>
              <p className="text-sm leading-relaxed mb-4">
                본 약관은 뇌파 기반 인지능력 평가 서비스(이하 "서비스")를 제공하는 회사(이하 "회사")와 
                이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>

              <h3 className="text-lg font-semibold mb-3">제2조 (정의)</h3>
              <p className="text-sm leading-relaxed mb-2">
                본 약관에서 사용하는 용어의 정의는 다음과 같습니다:
              </p>
              <ul className="text-sm leading-relaxed mb-4 list-disc pl-6">
                <li>"서비스"란 뇌파 데이터를 활용한 인지능력 평가 및 분석 서비스를 의미합니다.</li>
                <li>"이용자"란 본 약관에 따라 서비스를 이용하는 자를 의미합니다.</li>
                <li>"뇌파 데이터"란 이용자의 뇌파 신호를 측정하여 수집된 데이터를 의미합니다.</li>
              </ul>

              <h3 className="text-lg font-semibold mb-3">제3조 (약관의 효력 및 변경)</h3>
              <p className="text-sm leading-relaxed mb-4">
                1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.<br/>
                2. 회사는 합리적인 사유가 발생할 경우에는 본 약관을 변경할 수 있으며, 약관이 변경되는 경우 
                변경된 약관의 내용과 시행일을 정하여 시행일 7일 전에 공지합니다.
              </p>

              <h3 className="text-lg font-semibold mb-3">제4조 (서비스의 제공)</h3>
              <p className="text-sm leading-relaxed mb-4">
                1. 회사는 다음과 같은 서비스를 제공합니다:<br/>
                - 뇌파 기반 인지능력 평가<br/>
                - 평가 결과 분석 및 리포트 제공<br/>
                - 개인별 맞춤형 인지능력 개선 방안 제시<br/>
                2. 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.
              </p>

              <h3 className="text-lg font-semibold mb-3">제5조 (이용자의 의무)</h3>
              <p className="text-sm leading-relaxed mb-4">
                1. 이용자는 다음 행위를 하여서는 안 됩니다:<br/>
                - 서비스의 안정적 운영을 방해하는 행위<br/>
                - 타인의 정보를 도용하거나 부정하게 사용하는 행위<br/>
                - 서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하는 행위<br/>
                2. 이용자는 서비스 이용 시 정확한 정보를 제공해야 합니다.
              </p>

              <h3 className="text-lg font-semibold mb-3">제6조 (개인정보보호)</h3>
              <p className="text-sm leading-relaxed mb-4">
                회사는 이용자의 개인정보를 보호하기 위해 개인정보처리방침을 수립하고 이를 준수합니다. 
                개인정보처리방침은 서비스 화면에 게시하여 이용자가 언제든지 확인할 수 있도록 합니다.
              </p>

              <h3 className="text-lg font-semibold mb-3">제7조 (서비스의 중단)</h3>
              <p className="text-sm leading-relaxed mb-4">
                1. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 
                서비스의 제공을 일시적으로 중단할 수 있습니다.<br/>
                2. 회사는 서비스의 제공을 중단하고자 하는 경우에는 사전에 공지합니다.
              </p>

              <h3 className="text-lg font-semibold mb-3">제8조 (손해배상)</h3>
              <p className="text-sm leading-relaxed mb-4">
                회사는 무료로 제공되는 서비스와 관련하여 이용자에게 어떠한 손해가 발생하더라도 동 손해가 회사의 
                중대한 과실에 의한 경우를 제외하고는 이에 대하여 책임을 부담하지 아니합니다.
              </p>

              <h3 className="text-lg font-semibold mb-3">제9조 (준거법 및 관할법원)</h3>
              <p className="text-sm leading-relaxed mb-4">
                본 약관에 명시되지 않은 사항은 전기통신사업법 등 관계법령과 상관례에 따르며, 
                서비스 이용으로 발생한 분쟁에 대해 소송이 제기되는 경우 회사의 본사 소재지를 관할하는 법원을 전속 관할법원으로 합니다.
              </p>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>부칙</strong><br/>
                  본 약관은 2024년 1월 1일부터 시행합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
