package com.smhrd.eegbrain.entity;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;

import java.time.LocalDateTime;
import lombok.Data;

@Entity
@Table(name = "user")
@Data
public class UserEntity {

    @Id
    private String uid;

    @Column(nullable = false)
    private String pw;

    @Column(nullable = false)
    private String name;
	
    @Column(nullable = false)
    private String phone; // 전화번호 (010-1234-5678 형식)

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    // --------- 편의 메서드 ---------
    public String getFormattedPhone() {
        return phone;
    }

    public void setFormattedPhone(String phone) {
        // 전화번호 형식 검증 및 저장
        if (phone != null && phone.matches("\\d{3}-\\d{4}-\\d{4}")) {
            this.phone = phone;
        } else {
            this.phone = phone;
        }
    }

    @PrePersist
    protected void onCreate() {
        if (this.joinedAt == null) {
            this.joinedAt = LocalDateTime.now();
        }
    }
}