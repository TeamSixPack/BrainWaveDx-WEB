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
            
            // 새로운 강력한 ID 기준 정렬 메서드 사용
            List<AssessmentRecordEntity> records = assessmentRecordRepository.findByUserIdOrderByIdDesc(userId);
            System.out.println("🔍 새로운 ID 기준 정렬로 조회된 기록 수: " + records.size());
            
            // 만약 여전히 정렬이 안 되면 네이티브 쿼리 시도
            if (records.size() > 1) {
                AssessmentRecordEntity first = records.get(0);
                AssessmentRecordEntity last = records.get(records.size() - 1);
                if (first.getId() < last.getId()) {
                    System.out.println("⚠️ JPQL 정렬이 실패했습니다. 네이티브 쿼리로 재시도합니다.");
                    try {
                        List<Object[]> nativeResults = assessmentRecordRepository.findByUserIdOrderByIdDescNative(userId);
                        // 네이티브 쿼리 결과를 Entity로 변환
                        records = convertNativeResultsToEntities(nativeResults);
                        System.out.println("🔍 네이티브 쿼리로 재조회된 기록 수: " + records.size());
                    } catch (Exception e) {
                        System.err.println("❌ 네이티브 쿼리 실패: " + e.getMessage());
                    }
                }
            }
            
            // 최종 보장을 위한 Java 레벨 강제 정렬
            records.sort((a, b) -> Long.compare(b.getId(), a.getId()));
            
            // 정렬 순서 확인을 위한 로그
            if (!records.isEmpty()) {
                System.out.println("🔍 Java 레벨 정렬 후 순서 확인:");
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
    
    // 네이티브 쿼리 결과를 Entity로 변환하는 메서드
    private List<AssessmentRecordEntity> convertNativeResultsToEntities(List<Object[]> nativeResults) {
        List<AssessmentRecordEntity> entities = new ArrayList<>();
        
        for (Object[] result : nativeResults) {
            try {
                AssessmentRecordEntity entity = new AssessmentRecordEntity();
                
                // assessment_records 테이블 컬럼들
                entity.setId(((Number) result[0]).longValue()); // id
                entity.setAssessmentDate(((java.sql.Timestamp) result[2]).toLocalDateTime()); // assessment_date
                entity.setEegResult((String) result[3]); // eeg_result
                entity.setMocaScore((Integer) result[4]); // moca_score
                entity.setMmseScore((Integer) result[5]); // mmse_score
                entity.setCreatedAt(((java.sql.Timestamp) result[6]).toLocalDateTime()); // created_at
                
                // users 테이블 컬럼들
                UserEntity user = new UserEntity();
                user.setUid((String) result[7]); // uid
                user.setName((String) result[8]); // name
                user.setPhone((String) result[9]); // phone
                
                entity.setUser(user);
                entities.add(entity);
                
            } catch (Exception e) {
                System.err.println("❌ 네이티브 결과 변환 실패: " + e.getMessage());
            }
        }
        
        return entities;
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
