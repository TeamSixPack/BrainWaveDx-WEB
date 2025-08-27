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
            
            // 기본 메서드로 먼저 시도
            List<AssessmentRecordEntity> records = assessmentRecordRepository.findByUser_UidOrderByAssessmentDateDesc(userId);
            System.out.println("🔍 기본 메서드로 조회된 기록 수: " + records.size());
            
            if (records.isEmpty()) {
                // JOIN FETCH 쿼리로 시도
                records = assessmentRecordRepository.findByUserIdOrderByAssessmentDateDesc(userId);
                System.out.println("🔍 JOIN FETCH로 조회된 기록 수: " + records.size());
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
        return assessmentRecordRepository.findByUserIdAndAssessmentDateBetweenOrderByAssessmentDateDesc(userId, startDate, endDate);
    }

    // 검사 기록 상세 조회
    public Optional<AssessmentRecordEntity> getAssessmentRecordById(Long recordId) {
        return assessmentRecordRepository.findById(recordId);
    }
}
