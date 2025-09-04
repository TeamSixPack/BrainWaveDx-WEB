import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacy() {
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
            <CardTitle className="text-2xl font-bold text-center">개인정보처리방침</CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              시행일자: 2024년 1월 1일
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-3">제1조 (개인정보의 처리목적)</h3>
              <p className="text-sm leading-relaxed mb-4">
                회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 
                이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 
                필요한 조치를 이행할 예정입니다.
              </p>
              <ul className="text-sm leading-relaxed mb-4 list-disc pl-6">
                <li>뇌파 기반 인지능력 평가 서비스 제공</li>
                <li>회원 가입 및 관리</li>
                <li>서비스 개선 및 신규 서비스 개발</li>
                <li>고객 상담 및 불만 처리</li>
              </ul>

              <h3 className="text-lg font-semibold mb-3">제2조 (개인정보의 처리 및 보유기간)</h3>
              <p className="text-sm leading-relaxed mb-4">
                1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 
                개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.<br/>
                2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
              </p>
              <ul className="text-sm leading-relaxed mb-4 list-disc pl-6">
                <li>회원 정보: 회원 탈퇴 시까지</li>
                <li>뇌파 데이터: 평가 완료 후 1년</li>
                <li>서비스 이용 기록: 3년</li>
              </ul>

              <h3 className="text-lg font-semibold mb-3">제3조 (처리하는 개인정보의 항목)</h3>
              <p className="text-sm leading-relaxed mb-4">
                회사는 다음의 개인정보 항목을 처리하고 있습니다:
              </p>
              <div className="text-sm leading-relaxed mb-4">
                <p className="font-medium mb-2">필수항목:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>이름, 아이디, 비밀번호, 전화번호</li>
                  <li>뇌파 측정 데이터</li>
                  <li>서비스 이용 기록</li>
                </ul>
                <p className="font-medium mb-2">선택항목:</p>
                <ul className="list-disc pl-6">
                  <li>이메일 주소</li>
                  <li>생년월일</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold mb-3">제4조 (개인정보의 제3자 제공)</h3>
              <p className="text-sm leading-relaxed mb-4">
                1. 회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 
                정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 
                개인정보를 제3자에게 제공합니다.<br/>
                2. 회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다:
              </p>
              <div className="text-sm leading-relaxed mb-4 p-4 bg-gray-50 rounded">
                <p className="font-medium">제공받는 자: 없음</p>
                <p className="font-medium">제공하는 개인정보 항목: 없음</p>
                <p className="font-medium">제공받는 자의 이용목적: 없음</p>
                <p className="font-medium">보유 및 이용기간: 없음</p>
              </div>

              <h3 className="text-lg font-semibold mb-3">제5조 (개인정보처리의 위탁)</h3>
              <p className="text-sm leading-relaxed mb-4">
                회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
              </p>
              <div className="text-sm leading-relaxed mb-4 p-4 bg-gray-50 rounded">
                <p className="font-medium">위탁받는 자: 없음</p>
                <p className="font-medium">위탁하는 업무의 내용: 없음</p>
              </div>

              <h3 className="text-lg font-semibold mb-3">제6조 (정보주체의 권리·의무 및 행사방법)</h3>
              <p className="text-sm leading-relaxed mb-4">
                1. 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
              </p>
              <ul className="text-sm leading-relaxed mb-4 list-disc pl-6">
                <li>개인정보 처리현황 통지요구</li>
                <li>개인정보 열람요구</li>
                <li>개인정보 정정·삭제요구</li>
                <li>개인정보 처리정지요구</li>
              </ul>
              <p className="text-sm leading-relaxed mb-4">
                2. 제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 
                회사는 이에 대해 지체없이 조치하겠습니다.
              </p>

              <h3 className="text-lg font-semibold mb-3">제7조 (개인정보의 안전성 확보조치)</h3>
              <p className="text-sm leading-relaxed mb-4">
                회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
              </p>
              <ul className="text-sm leading-relaxed mb-4 list-disc pl-6">
                <li>개인정보 취급 직원의 최소화 및 교육</li>
                <li>개인정보에 대한 접근 제한</li>
                <li>개인정보의 암호화</li>
                <li>해킹 등에 대비한 기술적 대책</li>
                <li>개인정보처리시스템 등의 접근권한 관리</li>
                <li>개인정보의 안전한 저장·전송을 위한 기술적 조치</li>
              </ul>

              <h3 className="text-lg font-semibold mb-3">제8조 (개인정보보호책임자)</h3>
              <p className="text-sm leading-relaxed mb-4">
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 
                불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다:
              </p>
              <div className="text-sm leading-relaxed mb-4 p-4 bg-gray-50 rounded">
                <p><strong>개인정보보호책임자</strong></p>
                <p>성명: 개인정보보호책임자</p>
                <p>연락처: privacy@example.com</p>
                <p>전화번호: 02-1234-5678</p>
              </div>

              <h3 className="text-lg font-semibold mb-3">제9조 (권익침해 구제방법)</h3>
              <p className="text-sm leading-relaxed mb-4">
                정보주체는 아래의 기관에 대해 개인정보 침해신고를 할 수 있습니다:
              </p>
              <ul className="text-sm leading-relaxed mb-4 list-disc pl-6">
                <li>개인정보보호위원회 (privacy.go.kr / 국번없이 182)</li>
                <li>개인정보보호단 (privacy.go.kr / 국번없이 182)</li>
                <li>대검찰청 사이버범죄수사단 (www.spo.go.kr / 02-3480-3571)</li>
                <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 국번없이 182)</li>
              </ul>

              <h3 className="text-lg font-semibold mb-3">제10조 (개인정보처리방침의 변경)</h3>
              <p className="text-sm leading-relaxed mb-4">
                이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 
                정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>부칙</strong><br/>
                  본 개인정보처리방침은 2024년 1월 1일부터 시행합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
