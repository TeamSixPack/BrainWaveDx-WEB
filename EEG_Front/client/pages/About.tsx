import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Brain, ArrowLeft, Users, Shield, Zap, FileText } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#dbeafe] to-[#f1f5f9] p-8">
      <div className="container mx-auto max-w-6xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-6">
          <Button variant="ghost" size="lg" asChild className="mb-6">
            <Link to="/">
              <ArrowLeft className="h-6 w-6 mr-3" />
              홈으로 돌아가기
            </Link>
          </Button>

          <div className="flex items-center justify-center space-x-3">
            <Brain className="h-12 w-12 text-primary" />
            <span className="text-3xl font-bold text-foreground">NeuroScan</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground leading-tight">
              NeuroScan에 대해
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              AI 기술을 활용한 혁신적인 뇌 건강 평가 플랫폼입니다
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">우리의 미션</CardTitle>
            <CardDescription className="text-lg">
              모든 사람이 쉽고 정확하게 뇌 건강을 모니터링할 수 있도록 돕습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-base text-muted-foreground leading-relaxed max-w-4xl mx-auto">
              NeuroScan은 최신 AI 기술과 뇌파 분석을 결합하여 개인의 인지 기능을 
              종합적으로 평가하는 플랫폼입니다. 복잡한 의료 검사 없이도 
              간단한 테스트를 통해 뇌 건강 상태를 파악할 수 있습니다.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-md transition-colors duration-200">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">AI 기반 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground leading-relaxed">
                최신 머신러닝 알고리즘을 사용하여 뇌파 데이터를 정확하게 분석하고 
                개인별 맞춤 결과를 제공합니다.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-md transition-colors duration-200">
            <CardHeader>
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">사용자 친화적</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground leading-relaxed">
                모든 연령대의 사용자가 쉽게 사용할 수 있도록 직관적이고 
                접근 가능한 인터페이스를 제공합니다.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-md transition-colors duration-200">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">보안 및 개인정보</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground leading-relaxed">
                사용자의 개인정보와 건강 데이터를 최우선으로 보호하며, 
                엄격한 보안 정책을 준수합니다.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-md transition-colors duration-200">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">빠른 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground leading-relaxed">
                복잡한 의료 검사 과정 없이도 몇 분 내에 
                인지 기능 평가 결과를 확인할 수 있습니다.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-md transition-colors duration-200">
            <CardHeader>
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl">전문가 수준</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground leading-relaxed">
                의료 전문가들이 검증한 신뢰할 수 있는 
                평가 도구와 해석 결과를 제공합니다.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-md transition-colors duration-200">
            <CardHeader>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl">지속적 모니터링</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground leading-relaxed">
                정기적인 테스트를 통해 뇌 건강 변화를 
                추적하고 장기적인 트렌드를 분석할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Technology Section */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">기술적 특징</CardTitle>
            <CardDescription className="text-lg">
              최신 기술을 활용한 정확하고 신뢰할 수 있는 분석
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground">뇌파 분석</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  고품질 뇌파 데이터를 수집하고 분석하여 인지 기능의 
                  다양한 측면을 종합적으로 평가합니다.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground">AI 알고리즘</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  딥러닝과 머신러닝을 활용하여 패턴을 인식하고 
                  개인별 맞춤 분석을 수행합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-foreground">
            지금 시작해보세요
          </h2>
          <p className="text-lg text-muted-foreground">
            NeuroScan과 함께 뇌 건강을 관리하고 모니터링하세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/assessment">
                테스트 시작하기
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/">
                홈으로 돌아가기
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
