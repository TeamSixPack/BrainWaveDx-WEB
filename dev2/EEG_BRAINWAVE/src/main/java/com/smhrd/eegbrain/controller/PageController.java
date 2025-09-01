package com.smhrd.eegbrain.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.smhrd.eegbrain.service.FlaskClientService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Controller
@RequiredArgsConstructor
public class PageController {
	
	
    private final FlaskClientService flaskClientService;
    private final RestTemplate rest = new RestTemplate();
    private final String FLASK_INFER_URL = "http://127.0.0.1:8000/infer";

	
    // ---------- 공용 ---------- //
    @GetMapping({"/","mainPage"})
    public String mainPage() {
    	return "common/mainPage";
    }	
    
    // ---------- 회원 ---------- //
    @GetMapping(value = "/joinPage")
    public String joinPage() {
    	return "user/joinPage";
    }
    @GetMapping(value = "/loginPage")
    public String loginPage() {
    	return "user/loginPage";
    }
    
    // ---------- 뇌파진단 ---------- //
    @GetMapping("/inferPage")
    public String inferPage() { return "inferPage"; }

    @PostMapping("/inferResult.do")
    public String inferResult(
            @RequestParam String filePath,
            @RequestParam(required = false) String subjectId,
            @RequestParam(required = false) String trueLabel,
            @RequestParam(required = false, defaultValue = "true") String enforceTwoMinutes,
            Model model
    ) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("file_path", filePath);
            if (subjectId != null && !subjectId.isBlank()) payload.put("subject_id", subjectId);
            if (trueLabel != null && !trueLabel.isBlank()) payload.put("true_label", trueLabel);
            // 체크박스 값이 "true"/"on" 등으로 올 수 있으니 단순 문자열로 넘겨도 Flask에서 처리하도록 함
            payload.put("enforce_two_minutes", enforceTwoMinutes);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> req = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> resp = rest.postForEntity(FLASK_INFER_URL, req, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                Object result = ((Map<?, ?>)resp.getBody()).get("result");
                if (result instanceof Map) {
                    model.addAttribute("result", result);
                } else {
                    model.addAttribute("result", null);
                    model.addAttribute("error", "응답 형식 오류");
                }
            } else {
                model.addAttribute("result", null);
                model.addAttribute("error", "Flask 응답 실패: " + resp.getStatusCode());
            }
        } catch (Exception e) {
            model.addAttribute("result", null);
            model.addAttribute("error", "예외: " + e.getMessage());
        }
        return "inferResultPage";
    }
}