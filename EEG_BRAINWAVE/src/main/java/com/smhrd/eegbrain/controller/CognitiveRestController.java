package com.smhrd.eegbrain.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smhrd.eegbrain.service.AssessmentRecordService;

@RestController
public class CognitiveRestController {

    @Autowired
    private AssessmentRecordService assessmentRecordService;

    // 검사 결과 저장 (새로운 구조)
    @PostMapping("/api/assessment/save")
    public ResponseEntity<Map<String, Object>> saveAssessmentResult(
            @RequestParam("userId") String userId,
            @RequestParam("eegResult") String eegResult,
            @RequestParam(value = "mocaScore", required = false) Integer mocaScore,
            @RequestParam(value = "mmseScore", required = false) Integer mmseScore) {
        
        Map<String, Object> res = new HashMap<>();
        
        try {
            // 유효성 검사
            if (eegResult == null || eegResult.trim().isEmpty()) {
                res.put("success", false);
                res.put("message", "eegResult가 비어 있습니다.");
                return ResponseEntity.badRequest().body(res);
            }

            String normalized = eegResult.trim();
            
            // 검사 결과 저장
            var savedRecord = assessmentRecordService.saveAssessmentRecord(
                userId, normalized, mocaScore, mmseScore);
            
            res.put("success", true);
            res.put("message", "검사 결과가 저장되었습니다.");
            res.put("recordId", savedRecord.getId());
            return ResponseEntity.ok(res);
            
        } catch (Exception e) {
            res.put("success", false);
            res.put("message", "검사 결과 저장에 실패했습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(res);
        }
    }
}


