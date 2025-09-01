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
    List<AssessmentRecordEntity> findByUser_UidOrderByCreatedAtDesc(String uid);
    
    // JOIN FETCH를 사용하여 user 정보를 미리 로드 (ID 기준 내림차순 정렬 - 최신이 맨 위)
    @Query("SELECT ar FROM AssessmentRecordEntity ar JOIN FETCH ar.user WHERE ar.user.uid = :userId ORDER BY ar.id DESC")
    List<AssessmentRecordEntity> findByUserIdOrderByCreatedAtDesc(@Param("userId") String userId);
    
    // ID 기준으로 정렬 (백업용) - 최신이 맨 위
    @Query("SELECT ar FROM AssessmentRecordEntity ar JOIN FETCH ar.user WHERE ar.user.uid = :userId ORDER BY ar.id DESC")
    List<AssessmentRecordEntity> findByUserIdOrderByAssessmentDateDesc(@Param("userId") String userId);
    
    // 강제로 ID 내림차순 정렬하는 새로운 메서드
    @Query("SELECT ar FROM AssessmentRecordEntity ar JOIN FETCH ar.user WHERE ar.user.uid = :userId ORDER BY ar.id DESC")
    List<AssessmentRecordEntity> findByUserIdOrderByIdDesc(@Param("userId") String userId);
    
    // 네이티브 쿼리로 강제 정렬
    @Query(value = "SELECT ar.*, u.* FROM assessment_records ar " +
                   "JOIN users u ON ar.uid = u.uid " +
                   "WHERE ar.uid = :userId " +
                   "ORDER BY ar.id DESC", nativeQuery = true)
    List<Object[]> findByUserIdOrderByIdDescNative(@Param("userId") String userId);
    
    @Query("SELECT COUNT(ar) FROM AssessmentRecordEntity ar WHERE ar.user.uid = :userId")
    Long countByUserId(@Param("userId") String userId);
    
    @Query("SELECT ar FROM AssessmentRecordEntity ar JOIN FETCH ar.user WHERE ar.user.uid = :userId AND ar.assessmentDate BETWEEN :startDate AND :endDate ORDER BY ar.createdAt DESC")
    List<AssessmentRecordEntity> findByUserIdAndAssessmentDateBetweenOrderByCreatedAtDesc(
        @Param("userId") String userId, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );
}
