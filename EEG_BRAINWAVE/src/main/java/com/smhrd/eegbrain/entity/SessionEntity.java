package com.smhrd.eegbrain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "tb_session")
@Data
public class SessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_idx")
    private Integer sessionIdx;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "eeg_result")
    private String eegResult; // 정상/경도인지장애/치매 등 최종 문자열 결과
}


