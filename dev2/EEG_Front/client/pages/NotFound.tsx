import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background via-accent/20 to-background">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="space-y-6">
          <h1 className="text-8xl font-bold text-primary">404</h1>
          <h2 className="text-4xl font-bold text-foreground">페이지를 찾을 수 없습니다</h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            <br />
            홈페이지로 돌아가서 다시 시도해보세요.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="xl" asChild>
            <Link to="/">
              <Home className="h-6 w-6 mr-3" />
              홈으로 돌아가기
            </Link>
          </Button>
          <Button size="xl" variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-6 w-6 mr-3" />
            이전 페이지로
          </Button>
        </div>
      </div>
    </div>
  );
}
