package com.smhrd.eegbrain.service;

import com.smhrd.eegbrain.dto.VoiceConsultationRequest;
import com.smhrd.eegbrain.dto.VoiceConsultationResponse;
import com.smhrd.eegbrain.entity.UserEntity;
import com.smhrd.eegbrain.entity.VoiceConsultationRecord;
import com.smhrd.eegbrain.repository.UserRepository;
import com.smhrd.eegbrain.repository.VoiceConsultationRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class VoiceConsultationService {
    
    @Autowired
    private VoiceConsultationRecordRepository voiceConsultationRecordRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // 음성 상담 기록 저장
    public VoiceConsultationResponse saveVoiceConsultation(VoiceConsultationRequest request) {
        VoiceConsultationRecord record = new VoiceConsultationRecord();
        record.setRawData(request.getRawData());
        record.setAiSummary(request.getAiSummary());
        
        // 사용자 ID가 제공된 경우 사용자 정보 설정
        if (request.getUid() != null) {
            record.setUid(request.getUid());
            Optional<UserEntity> userOptional = userRepository.findById(request.getUid());
            if (userOptional.isPresent()) {
                record.setUser(userOptional.get());
            }
        }
        
        VoiceConsultationRecord savedRecord = voiceConsultationRecordRepository.save(record);
        
        return new VoiceConsultationResponse(
            savedRecord.getId(),
            savedRecord.getRawData(),
            savedRecord.getAiSummary(),
            savedRecord.getUid(),
            savedRecord.getUser() != null ? savedRecord.getUser().getName() : null,
            savedRecord.getCreatedAt()
        );
    }
    
    // 사용자 ID로 상담 기록 조회
    public List<VoiceConsultationResponse> getConsultationsByUid(String uid) {
        List<VoiceConsultationRecord> records = voiceConsultationRecordRepository.findByUidOrderByCreatedAtDesc(uid);
        
        return records.stream()
            .map(record -> new VoiceConsultationResponse(
                record.getId(),
                record.getRawData(),
                record.getAiSummary(),
                record.getUid(),
                record.getUser() != null ? record.getUser().getName() : null,
                record.getCreatedAt()
            ))
            .collect(Collectors.toList());
    }
    

    
    // 특정 기간 동안의 상담 기록 조회
    public List<VoiceConsultationResponse> getConsultationsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        List<VoiceConsultationRecord> records = voiceConsultationRecordRepository.findByDateRange(startDate, endDate);
        
        return records.stream()
            .map(record -> new VoiceConsultationResponse(
                record.getId(),
                record.getRawData(),
                record.getAiSummary(),
                record.getUid(),
                record.getUser() != null ? record.getUser().getName() : null,
                record.getCreatedAt()
            ))
            .collect(Collectors.toList());
    }
    
    // 사용자 ID와 특정 기간 동안의 상담 기록 조회
    public List<VoiceConsultationResponse> getConsultationsByUidAndDateRange(String uid, LocalDateTime startDate, LocalDateTime endDate) {
        List<VoiceConsultationRecord> records = voiceConsultationRecordRepository.findByUidAndDateRange(uid, startDate, endDate);
        
        return records.stream()
            .map(record -> new VoiceConsultationResponse(
                record.getId(),
                record.getRawData(),
                record.getAiSummary(),
                record.getUid(),
                record.getUser() != null ? record.getUser().getName() : null,
                record.getCreatedAt()
            ))
            .collect(Collectors.toList());
    }
    
    // 상담 기록 개수 조회 (사용자별)
    public long getConsultationCountByUid(String uid) {
        return voiceConsultationRecordRepository.countByUid(uid);
    }
    

    
    // 상담 기록 삭제
    public boolean deleteConsultation(Long consultationId) {
        if (voiceConsultationRecordRepository.existsById(consultationId)) {
            voiceConsultationRecordRepository.deleteById(consultationId);
            return true;
        }
        return false;
    }
}
