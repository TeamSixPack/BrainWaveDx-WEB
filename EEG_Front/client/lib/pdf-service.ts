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
    pdfColor?: string;
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
            line-height: 1.2;
            color: #111827;
            margin: 0;
            font-size: 12px;
          }
          .container { max-width: 800px; margin: 0 auto; }

          .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .logo { font-size: 20px; font-weight: 700; color: #2563eb; margin-bottom: 4px; }
          .title { font-size: 18px; font-weight: 700; margin: 0; }
          .meta { font-size: 12px; color: #374151; margin-top: 4px; }

          .section { margin-bottom: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; }
          .section-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 10px; }

          .cards { display: flex; flex-wrap: wrap; gap: 10px; }
          .card { flex: 1 1 130px; background: #f9fafb; padding: 10px; border-radius: 6px; text-align: center; }
          .score-value { 
            font-size: 20px; 
            font-weight: 800; 
            text-align: center;
            /* 색상은 인라인 스타일로만 제어 */
          }
          

          .score-label { font-size: 12px; color: #6b7280; }
          .risk-low { color: #16a34a; }

          .k-desc { font-size: 13px; color: #111827; }
          .muted { color: #6b7280; font-size: 12px; }

          .brainwave-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .brainwave-item { background: #f3f4f6; padding: 10px; border-radius: 5px; border-left: 3px solid #2563eb; }

          .recommendations { list-style: none; padding: 0; margin: 0; }
          .recommendations li { background: #eff6ff; margin: 5px 0; padding: 8px 10px; border-left: 2px solid #2563eb; border-radius: 4px; font-size: 13px; }
          .disclaimer { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 10px; font-size: 12px; }
          
          .guide-card { 
            padding: 10px; 
            border-radius: 5px; 
            margin-bottom: 8px;
          }
          .guide-card h4 { font-size: 13px; font-weight: 600; }
          .guide-card ul { margin: 0; padding-left: 16px; }
          .guide-card li { margin: 3px 0; font-size: 12px; line-height: 1.3; }

          .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .compact { margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🧠 NeuroScan</div>
            <h1 class="title">뇌 건강 검사 결과 보고서</h1>
            <div class="meta">${data.patientName ? `성명: ${data.patientName}` : ''}</div>
          </div>

          <div class="section">
            <div class="section-title">1) 요약 결과</div>
            <div class="cards">
              <div class="card">
                <div class="score-value" style="color: ${data.personalizedGuide?.pdfColor || '#2563eb'}; font-weight: 800; text-align: center;">${data.overallRisk}</div>
                <div class="score-label">진단 요약</div>
              </div>
              ${typeof data.confidenceLevel === 'number' ? `
              <div class="card">
                <div class="score-value">${data.confidenceLevel}%</div>
                <div class="score-label">AI 분석 결과</div>
              </div>` : ''}
              ${typeof data.mocaScore === 'number' ? `
              <div class="card">
                <div class="score-value">${data.mocaScore}/24</div>
                <div class="score-label">MOCA-K(종합 인지 검사)</div>
              </div>` : ''}
              ${typeof data.mmseScore === 'number' ? `
              <div class="card">
                <div class="score-value">${data.mmseScore}/23</div>
                <div class="score-label">MMSE-K(간이 인지 검사)</div>
              </div>` : ''}
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
              <div class="guide-card" style="background: ${data.personalizedGuide.pdfColor ? `${data.personalizedGuide.pdfColor}10` : '#f9fafb'}; border: 1px solid ${data.personalizedGuide.pdfColor ? `${data.personalizedGuide.pdfColor}30` : '#e5e7eb'};">
                <h4 style="color: ${data.personalizedGuide.pdfColor || '#059669'}; margin: 0 0 6px 0; font-size: 13px; font-weight: 600;">
                  🍽️ ${data.personalizedGuide.guides.food.title}
                </h4>
                <ul style="margin: 0; padding-left: 16px; font-size: 12px;">
                  ${data.personalizedGuide.guides.food.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
              
              <div class="guide-card" style="background: ${data.personalizedGuide.pdfColor ? `${data.personalizedGuide.pdfColor}10` : '#f9fafb'}; border: 1px solid ${data.personalizedGuide.pdfColor ? `${data.personalizedGuide.pdfColor}30` : '#e5e7eb'};">
                <h4 style="color: ${data.personalizedGuide.pdfColor || '#059669'}; margin: 0 0 6px 0; font-size: 13px; font-weight: 600;">
                  🏃‍♂️ ${data.personalizedGuide.guides.exercise.title}
                </h4>
                <ul style="margin: 0; padding-left: 16px; font-size: 12px;">
                  ${data.personalizedGuide.guides.exercise.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            </div>
            
            <div class="guide-card" style="margin-top: 8px; background: ${data.personalizedGuide.pdfColor ? `${data.personalizedGuide.pdfColor}10` : '#f9fafb'}; border: 1px solid ${data.personalizedGuide.pdfColor ? `${data.personalizedGuide.pdfColor}30` : '#e5e7eb'};">
              <h4 style="color: ${data.personalizedGuide.pdfColor || '#059669'}; margin: 0 0 6px 0; font-size: 13px; font-weight: 600;">
                🎯 ${data.personalizedGuide.guides.behavior.title}
              </h4>
              <ul style="margin: 0; padding-left: 16px; font-size: 12px;">
                ${data.personalizedGuide.guides.behavior.items.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          </div>
          ` : ''}

          <div class="two-column">
            <div class="section compact">
              <div class="section-title">${data.personalizedGuide ? '5' : '4'}) 추가 정보</div>
              <div style="font-size: 13px; line-height: 1.3;">
                <p><strong>검사 방법:</strong> 뇌파 신호 분석 + 인지 기능 테스트</p>
                <p><strong>검사 시간:</strong> 약 10-15분</p>
                <p><strong>결과 해석:</strong> AI 기반 자동 분석</p>
                <p><strong>권장사항:</strong> 정기적인 뇌 건강 체크</p>
              </div>
            </div>

            <div class="section compact">
              <div class="section-title">${data.personalizedGuide ? '6' : '5'}) 연락처 및 후속 조치</div>
              <div style="font-size: 13px; line-height: 1.3;">
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
