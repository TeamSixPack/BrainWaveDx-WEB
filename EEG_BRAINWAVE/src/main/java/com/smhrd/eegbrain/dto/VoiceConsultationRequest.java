package com.smhrd.eegbrain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class VoiceConsultationRequest {
    
    @NotBlank(message = "원본 데이터는 필수입니다")
    private String rawData;
    
    @NotBlank(message = "AI 요약 데이터는 필수입니다")
    private String aiSummary;
    
    private String uid; // 선택적 (로그인된 사용자의 경우)
    
    // 기본 생성자
    public VoiceConsultationRequest() {}
    
    // 생성자
    public VoiceConsultationRequest(String rawData, String aiSummary) {
        this.rawData = rawData;
        this.aiSummary = aiSummary;
    }
    
    // 생성자 (사용자 ID 포함)
    public VoiceConsultationRequest(String rawData, String aiSummary, String uid) {
        this.rawData = rawData;
        this.aiSummary = aiSummary;
        this.uid = uid;
    }
    
    // Getter와 Setter
    public String getRawData() {
        return rawData;
    }
    
    public void setRawData(String rawData) {
        this.rawData = rawData;
    }
    
    public String getAiSummary() {
        return aiSummary;
    }
    
    public void setAiSummary(String aiSummary) {
        this.aiSummary = aiSummary;
    }
    

    
    public String getUid() {
        return uid;
    }
    
    public void setUid(String uid) {
        this.uid = uid;
    }
}
