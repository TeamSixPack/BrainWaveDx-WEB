package com.smhrd.eegbrain.dto;

import java.time.LocalDateTime;

public class VoiceConsultationResponse {
    
    private Long id;
    private String rawData;
    private String aiSummary;
    private String consultationType;
    private String uid;
    private String username; // 사용자명 (선택적)
    private LocalDateTime createdAt;
    
    // 기본 생성자
    public VoiceConsultationResponse() {}
    
    // 생성자
    public VoiceConsultationResponse(Long id, String rawData, String aiSummary, String consultationType, String uid, LocalDateTime createdAt) {
        this.id = id;
        this.rawData = rawData;
        this.aiSummary = aiSummary;
        this.consultationType = consultationType;
        this.uid = uid;
        this.createdAt = createdAt;
    }
    
    // 생성자 (사용자명 포함)
    public VoiceConsultationResponse(Long id, String rawData, String aiSummary, String consultationType, String uid, String username, LocalDateTime createdAt) {
        this.id = id;
        this.rawData = rawData;
        this.aiSummary = aiSummary;
        this.consultationType = consultationType;
        this.uid = uid;
        this.username = username;
        this.createdAt = createdAt;
    }
    
    // Getter와 Setter
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
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
    
    public String getConsultationType() {
        return consultationType;
    }
    
    public void setConsultationType(String consultationType) {
        this.consultationType = consultationType;
    }
    
    public String getUid() {
        return uid;
    }
    
    public void setUid(String uid) {
        this.uid = uid;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
