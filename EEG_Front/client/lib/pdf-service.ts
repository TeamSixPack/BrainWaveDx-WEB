// Simple PDF generation service
// In a real application, you would use a library like jsPDF or PDF-lib

export interface AssessmentData {
  patientName?: string;
  assessmentDate: string;
  overallRisk: string; // 진단 요약(예: 정상, 경도인지장애 등)
  mciRisk?: number;
  alzheimerRisk?: number;
  cognitiveScore?: number;
  mocaScore?: number;
  mmseScore?: number;
  confidenceLevel?: number; // 신뢰도(%)
  brainwaveAnalysis?: {
    alphaWaves: { value: number; status: string };
    betaWaves: { value: number; status: string };
    thetaWaves: { value: number; status: string };
    deltaWaves: { value: number; status: string };
  };
  recommendations: string[];
  cognitiveTestScore?: {
    total: number;
    max: number;
    percentage: number;
  };
  personalizedGuide?: {
    title: string;
    color: string;
    guides: {
      food: { title: string; items: string[] };
      exercise: { title: string; items: string[] };
      behavior: { title: string; items: string[] };
    };
  };
}

export class PDFService {
  static async generateAssessmentReport(data: AssessmentData): Promise<void> {
    // In a real implementation, this would generate a proper PDF
    // For now, we'll create a formatted HTML document that can be printed as PDF
    
    const reportContent = this.generateReportHTML(data);
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      
      // Auto-print after a brief delay
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }

  private static generateReportHTML(data: AssessmentData): string {
    const date = new Date(data.assessmentDate).toLocaleDateString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NeuroScan 검사 결과 보고서</title>
        <style>
          @page {
            size: A4;
            margin: 10mm 10mm;
          }
          html, body { height: auto; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.3;
            color: #111827;
            margin: 0;
            font-size: 10px;
          }
          .container { max-width: 800px; margin: 0 auto; }

          .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .logo { font-size: 18px; font-weight: 700; color: #2563eb; margin-bottom: 3px; }
          .title { font-size: 16px; font-weight: 700; margin: 0; }
          .meta { font-size: 9px; color: #374151; margin-top: 2px; }

          .section { margin-bottom: 10px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 5px; }
          .section-title { font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 8px; }

          .cards { display: flex; flex-wrap: wrap; gap: 8px; }
          .card { flex: 1 1 120px; background: #f9fafb; padding: 8px; border-radius: 5px; text-align: center; }
          .score-value { font-size: 18px; font-weight: 800; color: #2563eb; }
          .score-label { font-size: 9px; color: #6b7280; }
          .risk-low { color: #16a34a; } .risk-medium { color: #eab308; } .risk-high { color: #dc2626; }

          .k-desc { font-size: 10px; color: #111827; }
          .muted { color: #6b7280; font-size: 9px; }

          .brainwave-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .brainwave-item { background: #f3f4f6; padding: 8px; border-radius: 4px; border-left: 3px solid #2563eb; }

          .recommendations { list-style: none; padding: 0; margin: 0; }
          .recommendations li { background: #eff6ff; margin: 4px 0; padding: 6px 8px; border-left: 2px solid #2563eb; border-radius: 3px; }
          .disclaimer { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; padding: 8px; font-size: 9px; }
          
          .guide-card { 
            background: #f9fafb; 
            padding: 8px; 
            border-radius: 4px; 
            border: 1px solid #e5e7eb;
            margin-bottom: 6px;
          }
          .guide-card h4 { font-size: 10px; font-weight: 600; }
          .guide-card ul { margin: 0; padding-left: 14px; }
          .guide-card li { margin: 2px 0; font-size: 9px; line-height: 1.3; }

          .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .compact { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🧠 NeuroScan</div>
            <h1 class="title">뇌 건강 검사 결과 보고서</h1>
            <div class="meta">검사일: ${date}${data.patientName ? ` · 성명: ${data.patientName}` : ''}</div>
          </div>

          <div class="section">
            <div class="section-title">1) 요약 결과</div>
            <div class="cards">
              <div class="card">
                <div class="score-value">${data.overallRisk}</div>
                <div class="score-label">진단 요약</div>
              </div>
              <div class="card">
                <div class="score-value">${data.cognitiveScore}/100</div>
                <div class="score-label">뇌파 종합 점수</div>
              </div>
              ${typeof data.mocaScore === 'number' ? `
              <div class="card">
                <div class="score-value">${data.mocaScore}/30</div>
                <div class="score-label">MOCA-K</div>
              </div>` : ''}
              ${typeof data.mmseScore === 'number' ? `
              <div class="card">
                <div class="score-value">${data.mmseScore}/30</div>
                <div class="score-label">MMSE-K</div>
              </div>` : ''}

              ${typeof data.confidenceLevel === 'number' ? `
              <div class="card">
                <div class="score-value">${data.confidenceLevel}%</div>
                <div class="score-label">신뢰도</div>
              </div>` : ''}
            </div>
          </div>



            <div class="section compact">
              <div class="section-title">2) 인지 선별검사</div>
              ${typeof data.mocaScore === 'number' || typeof data.mmseScore === 'number' ? `
              <div class="cards">
                ${typeof data.mocaScore === 'number' ? `
                <div class="card">
                                  <div class="score-value">${data.mocaScore}/30</div>
                <div class="score-label">MOCA-K</div>
                </div>` : ''}
                ${typeof data.mmseScore === 'number' ? `
                <div class="card">
                                  <div class="score-value">${data.mmseScore}/30</div>
                <div class="score-label">MMSE-K</div>
                </div>` : ''}
              </div>` : '<p class="muted">검사 미완료</p>'}
            </div>
          </div>

          <div class="section compact">
            <div class="section-title">3) 생활 관리 권고</div>
            <ul class="recommendations">
              ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>

          ${data.personalizedGuide ? `
          <div class="section compact">
            <div class="section-title">4) 맞춤형 생활 가이드 - ${data.personalizedGuide.title}</div>
            <div class="two-column">
              <div class="guide-card">
                <h4 style="color: ${data.personalizedGuide.color === 'red' ? '#dc2626' : data.personalizedGuide.color === 'orange' ? '#ea580c' : '#16a34a'}; margin: 0 0 6px 0; font-size: 10px;">
                  🍽️ ${data.personalizedGuide.guides.food.title}
                </h4>
                <ul style="margin: 0; padding-left: 14px; font-size: 9px;">
                  ${data.personalizedGuide.guides.food.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
              
              <div class="guide-card">
                <h4 style="color: ${data.personalizedGuide.color === 'red' ? '#dc2626' : data.personalizedGuide.color === 'orange' ? '#ea580c' : '#16a34a'}; margin: 0 0 6px 0; font-size: 10px;">
                  🏃‍♂️ ${data.personalizedGuide.guides.exercise.title}
                </h4>
                <ul style="margin: 0; padding-left: 14px; font-size: 9px;">
                  ${data.personalizedGuide.guides.exercise.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            </div>
            
            <div class="guide-card" style="margin-top: 8px;">
              <h4 style="color: ${data.personalizedGuide.color === 'red' ? '#dc2626' : data.personalizedGuide.color === 'orange' ? '#ea580c' : '#16a34a'}; margin: 0 0 6px 0; font-size: 10px;">
                🎯 ${data.personalizedGuide.guides.behavior.title}
              </h4>
              <ul style="margin: 0; padding-left: 14px; font-size: 9px;">
                ${data.personalizedGuide.guides.behavior.items.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          </div>
          ` : ''}

          <div class="two-column">
            <div class="section compact">
              <div class="section-title">${data.personalizedGuide ? '5' : '4'}) 추가 정보</div>
              <div style="font-size: 10px; line-height: 1.3;">
                <p><strong>검사 방법:</strong> 뇌파 신호 분석 + 인지 기능 테스트</p>
                <p><strong>검사 시간:</strong> 약 10-15분</p>
                <p><strong>결과 해석:</strong> AI 기반 자동 분석</p>
                <p><strong>권장사항:</strong> 정기적인 뇌 건강 체크</p>
              </div>
            </div>

            <div class="section compact">
              <div class="section-title">${data.personalizedGuide ? '6' : '5'}) 연락처 및 후속 조치</div>
              <div style="font-size: 10px; line-height: 1.3;">
                <p><strong>상담 문의:</strong> 전문 의료기관 방문 권장</p>
                <p><strong>재검사:</strong> 6개월 후 권장</p>
                <p><strong>응급 상황:</strong> 증상 악화 시 즉시 병원</p>
                <p><strong>예방 관리:</strong> 규칙적인 운동과 건강한 식습관</p>
              </div>
            </div>
          </div>

          <div class="disclaimer">
            <strong>중요 고지:</strong> 본 보고서는 의학적 진단을 대체하지 않습니다. 전문 의료인의 상담을 받으시기 바랍니다. 이 검사는 스크리닝 목적으로만 사용되며, 정확한 진단은 전문 의료기관에서 받으시기 바랍니다.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getRiskClass(risk: number): string {
    if (risk < 20) return 'risk-low';
    if (risk < 50) return 'risk-medium';
    return 'risk-high';
  }

  private static formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
