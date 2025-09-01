package com.smhrd.eegbrain.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
public class WordValidationController {

    private static final String API_KEY = "54CC626A66A6061496197F45FC2A4737";
    private static final String API_URL = "https://stdict.korean.go.kr/api/search.do";

    @PostMapping("/api/validate-word")
    public ResponseEntity<Map<String, Object>> validateWord(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String word = request.get("word");
            
            if (word == null || word.trim().isEmpty()) {
                response.put("isValid", false);
                response.put("message", "단어가 입력되지 않았습니다.");
                return ResponseEntity.badRequest().body(response);
            }

            // ㄱ 초성 판별
            boolean startsWithG = startsWithG(word);
            if (!startsWithG) {
                response.put("isValid", false);
                response.put("message", "ㄱ으로 시작하지 않는 단어입니다.");
                return ResponseEntity.ok(response);
            }

            // 국립국어원 API 호출
            boolean isInDictionary = checkDictionary(word);
            
            response.put("isValid", isInDictionary);
            response.put("message", isInDictionary ? "유효한 단어입니다." : "사전에 등재되지 않은 단어입니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("isValid", false);
            response.put("message", "단어 검증 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ㄱ 초성 판별 함수
    private boolean startsWithG(String word) {
        if (word == null || word.isEmpty()) {
            return false;
        }
        
        char firstChar = word.charAt(0);
        
        // 한글인 경우
        if ('가' <= firstChar && firstChar <= '힣') {
            String[] 초성List = {"ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ",
                                "ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"};
            int code = firstChar - '가';
            String 초성 = 초성List[code / 588];
            return "ㄱ".equals(초성);
        } else {
            // 직접 ㄱ으로 시작하는 경우
            return firstChar == 'ㄱ';
        }
    }

    // 국립국어원 표준국어대사전 API 호출
    private boolean checkDictionary(String word) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            // API URL 구성 (URL 인코딩 추가)
            String encodedWord = java.net.URLEncoder.encode(word, "UTF-8");
            String url = String.format("%s?q=%s&key=%s&req_type=json", 
                                     API_URL, encodedWord, API_KEY);
            
            System.out.println("🔍 사전 API 호출 URL: " + url);
            
            // API 호출
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            System.out.println("📡 사전 API 응답 상태: " + response.getStatusCode());
            System.out.println("📋 사전 API 원본 응답: " + response.getBody());
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // JSON 파싱
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> data = mapper.readValue(response.getBody(), Map.class);
                
                System.out.println("📋 파싱된 응답 데이터: " + data);
                
                // channel.item 배열 확인
                if (data.containsKey("channel")) {
                    Map<String, Object> channel = (Map<String, Object>) data.get("channel");
                    System.out.println("📺 channel 데이터: " + channel);
                    
                    if (channel.containsKey("item")) {
                        Object item = channel.get("item");
                        System.out.println("📦 item 데이터: " + item);
                        
                        // item이 배열인 경우
                        if (item instanceof java.util.List) {
                            java.util.List<Map<String, Object>> items = (java.util.List<Map<String, Object>>) item;
                            System.out.println("📚 검색된 단어 개수: " + items.size());
                            
                            // 완전히 일치하는 단어가 있는지 확인 (하이픈 제거 후 비교)
                            for (Map<String, Object> itemMap : items) {
                                String dictWord = (String) itemMap.get("word");
                                String normalizedDictWord = dictWord.replace("-", "").replace("^", ""); // 하이픈과 캐럿 제거
                                System.out.println("🔤 사전 단어: " + dictWord + " (정규화: " + normalizedDictWord + ") vs 입력 단어: " + word);
                                if (word.equals(dictWord) || word.equals(normalizedDictWord)) {
                                    System.out.println("✅ 단어 일치 발견: " + word);
                                    return true;
                                }
                            }
                        }
                        // item이 단일 객체인 경우
                        else if (item instanceof Map) {
                            Map<String, Object> itemMap = (Map<String, Object>) item;
                            String dictWord = (String) itemMap.get("word");
                            String normalizedDictWord = dictWord.replace("-", "").replace("^", ""); // 하이픈과 캐럿 제거
                            System.out.println("🔤 사전 단어: " + dictWord + " (정규화: " + normalizedDictWord + ") vs 입력 단어: " + word);
                            if (word.equals(dictWord) || word.equals(normalizedDictWord)) {
                                System.out.println("✅ 단어 일치 발견: " + word);
                                return true;
                            }
                        }
                    } else {
                        System.out.println("❌ channel에 item이 없음");
                    }
                } else {
                    System.out.println("❌ 응답에 channel이 없음");
                }
            } else {
                System.out.println("❌ API 호출 실패 또는 응답 없음");
            }
            
            System.out.println("❌ 단어를 찾지 못함: " + word);
            return false;
            
        } catch (Exception e) {
            System.err.println("❌ 사전 API 호출 오류: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
