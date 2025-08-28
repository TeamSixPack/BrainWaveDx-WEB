package com.smhrd.eegbrain.service;

import com.smhrd.eegbrain.entity.AssessmentRecordEntity;
import com.smhrd.eegbrain.entity.UserEntity;
import com.smhrd.eegbrain.repository.AssessmentRecordRepository;
import com.smhrd.eegbrain.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;

@Service
@Transactional
public class AssessmentRecordService {

    @Autowired
    private AssessmentRecordRepository assessmentRecordRepository;

    @Autowired
    private UserRepository userRepository;

    // 검사 기록 저장
    public AssessmentRecordEntity saveAssessmentRecord(String userId, String eegResult, 
                                                     Integer mocaScore, Integer mmseScore) {
        Optional<UserEntity> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("사용자를 찾을 수 없습니다: " + userId);
        }

        AssessmentRecordEntity record = new AssessmentRecordEntity();
        record.setUser(userOpt.get());
        record.setEegResult(eegResult);
        record.setMocaScore(mocaScore);
        record.setMmseScore(mmseScore);
        record.setAssessmentDate(LocalDateTime.now());

        return assessmentRecordRepository.save(record);
    }

    // 사용자별 검사 기록 조회
    public List<AssessmentRecordEntity> getUserAssessmentRecords(String userId) {
        try {
            System.out.println("🔍 Service에서 사용자 ID: " + userId);
            
            // 사용자 존재 여부 확인
            Optional<UserEntity> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                System.out.println("❌ 사용자를 찾을 수 없음: " + userId);
                return new ArrayList<>();
            }
            System.out.println("✅ 사용자 찾음: " + userOpt.get().getName());
            
            // 전체 검사 기록 수 확인
            long totalCount = assessmentRecordRepository.count();
            System.out.println("🔍 전체 검사 기록 수: " + totalCount);
            
            // 모든 검사 기록 조회 (테스트용)
            List<AssessmentRecordEntity> allRecords = assessmentRecordRepository.findAll();
            System.out.println("🔍 모든 검사 기록: " + allRecords.size() + "개");
            
            if (!allRecords.isEmpty()) {
                AssessmentRecordEntity firstRecord = allRecords.get(0);
                System.out.println("🔍 첫 번째 기록 - ID: " + firstRecord.getId() + 
                                 ", User: " + (firstRecord.getUser() != null ? firstRecord.getUser().getUid() : "NULL") +
                                 ", EEG Result: " + firstRecord.getEegResult());
            }
            
            // JOIN FETCH 쿼리로 조회 (ID 기준 내림차순 정렬 - 최신이 맨 위)
            List<AssessmentRecordEntity> records = assessmentRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
            System.out.println("🔍 JOIN FETCH로 조회된 기록 수: " + records.size());
            
            // 정렬 순서 확인을 위한 로그
            if (!records.isEmpty()) {
                System.out.println("🔍 Repository 정렬 후 순서 확인:");
                for (int i = 0; i < records.size(); i++) {
                    AssessmentRecordEntity record = records.get(i);
                    System.out.println("  " + (i + 1) + "번째: ID=" + record.getId() + 
                                     ", assessmentDate=" + record.getAssessmentDate() + 
                                     ", createdAt=" + record.getCreatedAt() + 
                                     ", 결과=" + record.getEegResult());
                }
            }
            
            return records;
            
        } catch (Exception e) {
            System.err.println("❌ Service에서 오류 발생: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // 사용자별 검사 기록 수 조회
    public Long getUserAssessmentCount(String userId) {
        return assessmentRecordRepository.countByUserId(userId);
    }

    // 특정 기간 내 검사 기록 조회
    public List<AssessmentRecordEntity> getUserAssessmentRecordsByDateRange(String userId, LocalDateTime startDate, LocalDateTime endDate) {
        return assessmentRecordRepository.findByUserIdAndAssessmentDateBetweenOrderByCreatedAtDesc(userId, startDate, endDate);
    }

    // 검사 기록 상세 조회
    public Optional<AssessmentRecordEntity> getAssessmentRecordById(Long recordId) {
        return assessmentRecordRepository.findById(recordId);
    }
    
    // 검사 기록 삭제
    public boolean deleteAssessmentRecord(Long recordId) {
        try {
            System.out.println("🔍 Service에서 검사 기록 삭제 시작: " + recordId);
            
            Optional<AssessmentRecordEntity> recordOpt = assessmentRecordRepository.findById(recordId);
            if (recordOpt.isEmpty()) {
                System.out.println("❌ 삭제할 검사 기록을 찾을 수 없음: " + recordId);
                return false;
            }
            
            AssessmentRecordEntity record = recordOpt.get();
            System.out.println("🔍 삭제할 검사 기록: ID=" + record.getId() + 
                             ", User=" + (record.getUser() != null ? record.getUser().getUid() : "NULL") +
                             ", EEG Result=" + record.getEegResult());
            
            assessmentRecordRepository.delete(record);
            System.out.println("✅ 검사 기록 삭제 성공: " + recordId);
            
            return true;
            
        } catch (Exception e) {
            System.err.println("❌ Service에서 검사 기록 삭제 실패: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
