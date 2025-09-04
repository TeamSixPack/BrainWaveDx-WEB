package com.smhrd.eegbrain.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "assessment_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentRecordEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uid", referencedColumnName = "uid", nullable = false)
    @JsonBackReference
    private UserEntity user;
    
    @Column(name = "assessment_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime assessmentDate;
    
    @Column(name = "eeg_result")
    private String eegResult;
    
    @Column(name = "moca_score")
    private Integer mocaScore;
    
    @Column(name = "mmse_score")
    private Integer mmseScore;
    
    @Column(name = "created_at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (assessmentDate == null) {
            assessmentDate = LocalDateTime.now();
        }
    }
}
