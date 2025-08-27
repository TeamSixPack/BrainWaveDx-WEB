package com.smhrd.eegbrain.controller;

import com.smhrd.eegbrain.entity.AssessmentRecordEntity;
import com.smhrd.eegbrain.service.AssessmentRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/assessments")
@CrossOrigin(origins = "*")
public class AssessmentRecordController {

    @Autowired
    private AssessmentRecordService assessmentRecordService;

    // 검사 결과 저장
    @PostMapping
    public ResponseEntity<?> saveAssessmentRecord(@RequestBody Map<String, Object> request) {
        try {
            String userId = request.get("userId").toString();
            String eegResult = (String) request.get("eegResult");
            Integer mocaScore = request.get("mocaScore") != null ? 
                Integer.parseInt(request.get("mocaScore").toString()) : null;
            Integer mmseScore = request.get("mmseScore") != null ? 
                Integer.parseInt(request.get("mmseScore").toString()) : null;

            AssessmentRecordEntity savedRecord = assessmentRecordService.saveAssessmentRecord(
                userId, eegResult, mocaScore, mmseScore);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "검사 기록이 저장되었습니다.");
            response.put("recordId", savedRecord.getId());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "검사 결과 저장에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    // 사용자별 검사 기록 조회
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserAssessmentRecords(@PathVariable String userId) {
        try {
            System.out.println("🔍 사용자 ID로 검사 기록 조회 시작: " + userId);
            
            List<AssessmentRecordEntity> records = assessmentRecordService.getUserAssessmentRecords(userId);
            System.out.println("🔍 조회된 검사 기록 수: " + records.size());
            
            // user 정보를 포함하여 응답
            List<Map<String, Object>> responseRecords = records.stream()
                .map(record -> {
                    System.out.println("🔍 검사 기록 처리 중: " + record.getId() + ", User: " + record.getUser());
                    
                    // null 값 안전하게 처리
                    Map<String, Object> userMap = new HashMap<>();
                    if (record.getUser() != null) {
                        userMap.put("uid", record.getUser().getUid() != null ? record.getUser().getUid() : "");
                        userMap.put("name", record.getUser().getName() != null ? record.getUser().getName() : "");
                        userMap.put("phone", record.getUser().getPhone() != null ? record.getUser().getPhone() : "");
                    } else {
                        userMap.put("uid", "");
                        userMap.put("name", "");
                        userMap.put("phone", "");
                    }
                    
                    Map<String, Object> recordMap = new HashMap<>();
                    recordMap.put("id", record.getId());
                    recordMap.put("assessmentDate", record.getAssessmentDate());
                    recordMap.put("eegResult", record.getEegResult() != null ? record.getEegResult() : "");
                    recordMap.put("mocaScore", record.getMocaScore());
                    recordMap.put("mmseScore", record.getMmseScore());
                    recordMap.put("createdAt", record.getCreatedAt());
                    recordMap.put("user", userMap);
                    
                    return recordMap;
                })
                .toList();
            
            System.out.println("✅ 응답 데이터 생성 완료");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("records", responseRecords);
            response.put("count", responseRecords.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ 오류 발생: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "검사 기록 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    // 검사 기록 상세 조회
    @GetMapping("/{recordId}")
    public ResponseEntity<?> getAssessmentRecord(@PathVariable Long recordId) {
        try {
            var recordOpt = assessmentRecordService.getAssessmentRecordById(recordId);
            if (recordOpt.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("record", recordOpt.get());
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "검사 기록 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    // 사용자별 검사 기록 수 조회
    @GetMapping("/user/{userId}/count")
    public ResponseEntity<?> getUserAssessmentCount(@PathVariable String userId) {
        try {
            Long count = assessmentRecordService.getUserAssessmentCount(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", count);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "검사 기록 수 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
}
