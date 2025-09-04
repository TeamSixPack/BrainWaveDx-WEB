package com.smhrd.eegbrain.controller;

import com.smhrd.eegbrain.dto.VoiceConsultationRequest;
import com.smhrd.eegbrain.dto.VoiceConsultationResponse;
import com.smhrd.eegbrain.service.VoiceConsultationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/voice-consultation")
@CrossOrigin(origins = "*")
public class VoiceConsultationController {
    
    @Autowired
    private VoiceConsultationService voiceConsultationService;
    
    // 음성 상담 기록 저장
    @PostMapping("/save")
    public ResponseEntity<VoiceConsultationResponse> saveVoiceConsultation(
            @Valid @RequestBody VoiceConsultationRequest request) {
        try {
            VoiceConsultationResponse response = voiceConsultationService.saveVoiceConsultation(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // 사용자 ID로 상담 기록 조회
    @GetMapping("/user/{uid}")
    public ResponseEntity<List<VoiceConsultationResponse>> getConsultationsByUid(
            @PathVariable String uid) {
        try {
            List<VoiceConsultationResponse> consultations = voiceConsultationService.getConsultationsByUid(uid);
            return ResponseEntity.ok(consultations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    

    
    // 특정 기간 동안의 상담 기록 조회
    @GetMapping("/date-range")
    public ResponseEntity<List<VoiceConsultationResponse>> getConsultationsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            List<VoiceConsultationResponse> consultations = voiceConsultationService.getConsultationsByDateRange(startDate, endDate);
            return ResponseEntity.ok(consultations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // 사용자 ID와 특정 기간 동안의 상담 기록 조회
    @GetMapping("/user/{uid}/date-range")
    public ResponseEntity<List<VoiceConsultationResponse>> getConsultationsByUidAndDateRange(
            @PathVariable String uid,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            List<VoiceConsultationResponse> consultations = voiceConsultationService.getConsultationsByUidAndDateRange(uid, startDate, endDate);
            return ResponseEntity.ok(consultations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // 상담 기록 개수 조회 (사용자별)
    @GetMapping("/count/user/{uid}")
    public ResponseEntity<Long> getConsultationCountByUid(@PathVariable String uid) {
        try {
            long count = voiceConsultationService.getConsultationCountByUid(uid);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    

    
    // 상담 기록 삭제
    @DeleteMapping("/{consultationId}")
    public ResponseEntity<Boolean> deleteConsultation(@PathVariable Long consultationId) {
        try {
            boolean deleted = voiceConsultationService.deleteConsultation(consultationId);
            if (deleted) {
                return ResponseEntity.ok(true);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
