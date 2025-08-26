package com.smhrd.eegbrain.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "tb_cognitive")
@Data
public class CognitiveEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cog_idx")
    private Integer cognitiveIdx;

    @Column(name = "session_idx", nullable = false)
    private Integer sessionIdx;

    @Enumerated(EnumType.STRING)
    @Column(name = "cog_type", nullable = false, length = 10)
    private CognitiveType cognitiveType;

    @Column(name = "cog_score", nullable = false)
    private Integer cognitiveScore; // 0~30 범위 가정
}


