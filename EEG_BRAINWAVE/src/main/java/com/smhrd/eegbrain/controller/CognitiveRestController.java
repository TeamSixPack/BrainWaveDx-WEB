package com.smhrd.eegbrain.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smhrd.eegbrain.entity.CognitiveEntity;
import com.smhrd.eegbrain.entity.CognitiveType;
import com.smhrd.eegbrain.entity.SessionEntity;
import com.smhrd.eegbrain.service.CognitiveService;
import com.smhrd.eegbrain.service.SessionService;

@RestController
public class CognitiveRestController {

    @Autowired
    private SessionService sessionService;

    @Autowired
    private CognitiveService cognitiveService;

    // 세션 시작
    @PostMapping("/api/session/start")
    public ResponseEntity<Map<String, Object>> startSession(
            @RequestParam("userId") String userId) {
        Map<String, Object> res = new HashMap<>();
        SessionEntity s = sessionService.startSession(userId);
        res.put("success", true);
        res.put("sessionIdx", s.getSessionIdx());
        return ResponseEntity.ok(res);
    }

    // 세션 종료
    @PostMapping("/api/session/end")
    public ResponseEntity<Map<String, Object>> endSession(@RequestParam("sessionIdx") Integer sessionIdx) {
        Map<String, Object> res = new HashMap<>();
        Optional<SessionEntity> s = sessionService.endSession(sessionIdx);
        if (s.isPresent()) {
            res.put("success", true);
            return ResponseEntity.ok(res);
        }
        res.put("success", false);
        res.put("message", "세션을 찾을 수 없습니다.");
        return ResponseEntity.badRequest().body(res);
    }

    // EEG 결과 저장(간단 문자열: 정상/경도인지장애/치매)
    @PostMapping("/api/session/eeg-result")
    public ResponseEntity<Map<String, Object>> saveEegResult(
            @RequestParam("sessionIdx") Integer sessionIdx,
            @RequestParam("eegResult") String eegResult) {
        Map<String, Object> res = new HashMap<>();
        if (eegResult == null || eegResult.trim().isEmpty()) {
            res.put("success", false);
            res.put("message", "eegResult가 비어 있습니다.");
            return ResponseEntity.badRequest().body(res);
        }
        String normalized = eegResult.trim();
        // 간단 유효성(선택): 세 가지 중 하나인지 확인
        String lower = normalized.toLowerCase();
        if (!(lower.equals("정상") || lower.equals("경도인지장애") || lower.equals("치매")
                || lower.equals("normal") || lower.equals("mci") || lower.equals("dementia"))) {
            // 허용하지 않는다면 그대로 저장해도 되지만, 메시지 안내
            // 여기서는 그대로 저장하되 경고 메시지 반환
        }
        Optional<SessionEntity> s = sessionService.saveEegResult(sessionIdx, normalized);
        if (s.isPresent()) {
            res.put("success", true);
            return ResponseEntity.ok(res);
        }
        res.put("success", false);
        res.put("message", "세션을 찾을 수 없습니다.");
        return ResponseEntity.badRequest().body(res);
    }
    // 검사 점수 저장 (완료 시에만 호출)
    @PostMapping("/api/cognitive/score")
    public ResponseEntity<Map<String, Object>> saveCognitiveScore(
            @RequestParam("sessionIdx") Integer sessionIdx,
            @RequestParam("cogType") String cogType,
            @RequestParam("score") Integer score) {
        Map<String, Object> res = new HashMap<>();
        try {
            CognitiveType type = CognitiveType.valueOf(cogType.toUpperCase());
            if (score == null || score < 0 || score > 30) {
                res.put("success", false);
                res.put("message", "점수는 0~30 사이여야 합니다.");
                return ResponseEntity.badRequest().body(res);
            }
            CognitiveEntity saved = cognitiveService.saveScore(sessionIdx, type, score);
            res.put("success", true);
            res.put("cognitive", saved);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            res.put("success", false);
            res.put("message", "유효하지 않은 검사 종류입니다. (MMSE 또는 MOCA)");
            return ResponseEntity.badRequest().body(res);
        }
    }
}


