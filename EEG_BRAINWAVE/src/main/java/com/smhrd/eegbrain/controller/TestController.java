package com.smhrd.eegbrain.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class TestController {

    @GetMapping("/test")
    public String test() {
        return "CORS 테스트 성공! Spring Boot가 정상적으로 실행되고 있습니다.";
    }
    
    @PostMapping("/test-post")
    public Map<String, Object> testPost(@RequestParam("message") String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "POST 요청 테스트 성공: " + message);
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }
}
