package com.smhrd.eegbrain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "voice_consultation_records")
public class VoiceConsultationRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "uid", nullable = false)
    private String uid;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uid", insertable = false, updatable = false)
    private UserEntity user;
    
    @Column(name = "raw_data", columnDefinition = "TEXT", nullable = false)
    private String rawData;
    
    @Column(name = "ai_summary", columnDefinition = "TEXT", nullable = false)
    private String aiSummary;
    
    @Column(name = "consultation_type", length = 50)
    private String consultationType = "memory_helper";
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // 기본 생성자
    public VoiceConsultationRecord() {
        this.createdAt = LocalDateTime.now();
    }
    
    // 생성자
    public VoiceConsultationRecord(String rawData, String aiSummary, String consultationType) {
        this.rawData = rawData;
        this.aiSummary = aiSummary;
        this.consultationType = consultationType;
        this.createdAt = LocalDateTime.now();
    }
    
    // 생성자 (사용자 포함)
    public VoiceConsultationRecord(UserEntity user, String rawData, String aiSummary, String consultationType) {
        this.user = user;
        this.uid = user.getUid();
        this.rawData = rawData;
        this.aiSummary = aiSummary;
        this.consultationType = consultationType;
        this.createdAt = LocalDateTime.now();
    }
    
    // Getter와 Setter
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUid() {
        return uid;
    }
    
    public void setUid(String uid) {
        this.uid = uid;
    }
    
    public UserEntity getUser() {
        return user;
    }
    
    public void setUser(UserEntity user) {
        this.user = user;
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
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
