package com.smhrd.eegbrain.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class TestController {
    
    // 서버 연결 테스트
    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }
    
    // 음성 상담 테스트 데이터
    @GetMapping("/voice-consultation-sample")
    public Object getVoiceConsultationSample() {
        return new Object() {
            public final String rawData = "최근에 자주 물건을 어디에 두었는지 까먹고, 중요한 일정도 잊어버리는 것 같아요.";
            public final String aiSummary = "사용자의 음성 응답을 분석한 결과, 최근 기억력 저하 증상이 관찰됩니다. 물건을 자주 잃어버리고, 중요한 일정을 까먹는 경험이 있다고 하셨습니다. 이는 일시적인 스트레스나 피로로 인한 것일 수 있으나, 지속적인 증상이라면 전문의와 상담을 권장합니다.";
            public final String consultationType = "memory_helper";
        };
    }
}
