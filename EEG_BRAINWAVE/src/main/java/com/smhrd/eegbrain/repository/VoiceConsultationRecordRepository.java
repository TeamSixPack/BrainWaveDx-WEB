package com.smhrd.eegbrain.repository;

import com.smhrd.eegbrain.entity.VoiceConsultationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VoiceConsultationRecordRepository extends JpaRepository<VoiceConsultationRecord, Long> {
    
    // 사용자 ID로 상담 기록 조회
    List<VoiceConsultationRecord> findByUidOrderByCreatedAtDesc(String uid);
    
    // 특정 기간 동안의 상담 기록 조회
    @Query("SELECT v FROM VoiceConsultationRecord v WHERE v.createdAt BETWEEN :startDate AND :endDate ORDER BY v.createdAt DESC")
    List<VoiceConsultationRecord> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // 사용자 ID와 특정 기간 동안의 상담 기록 조회
    @Query("SELECT v FROM VoiceConsultationRecord v WHERE v.user.uid = :uid AND v.createdAt BETWEEN :startDate AND :endDate ORDER BY v.createdAt DESC")
    List<VoiceConsultationRecord> findByUidAndDateRange(@Param("uid") String uid, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // 상담 기록 개수 조회 (사용자별)
    long countByUid(String uid);
}
