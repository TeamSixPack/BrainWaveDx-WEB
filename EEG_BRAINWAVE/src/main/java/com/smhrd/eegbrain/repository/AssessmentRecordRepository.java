package com.smhrd.eegbrain.repository;

import com.smhrd.eegbrain.entity.AssessmentRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AssessmentRecordRepository extends JpaRepository<AssessmentRecordEntity, Long> {
    
    // 기본 메서드 (Spring Data JPA 자동 생성)
    List<AssessmentRecordEntity> findByUser_UidOrderByAssessmentDateDesc(String uid);
    
    // JOIN FETCH를 사용하여 user 정보를 미리 로드
    @Query("SELECT ar FROM AssessmentRecordEntity ar JOIN FETCH ar.user WHERE ar.user.uid = :userId ORDER BY ar.assessmentDate DESC")
    List<AssessmentRecordEntity> findByUserIdOrderByAssessmentDateDesc(@Param("userId") String userId);
    
    @Query("SELECT COUNT(ar) FROM AssessmentRecordEntity ar WHERE ar.user.uid = :userId")
    Long countByUserId(@Param("userId") String userId);
    
    @Query("SELECT ar FROM AssessmentRecordEntity ar JOIN FETCH ar.user WHERE ar.user.uid = :userId AND ar.assessmentDate BETWEEN :startDate AND :endDate ORDER BY ar.assessmentDate DESC")
    List<AssessmentRecordEntity> findByUserIdAndAssessmentDateBetweenOrderByAssessmentDateDesc(
        @Param("userId") String userId, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );
}
