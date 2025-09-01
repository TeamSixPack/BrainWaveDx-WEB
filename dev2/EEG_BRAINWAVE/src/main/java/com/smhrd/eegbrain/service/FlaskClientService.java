package com.smhrd.eegbrain.service;

import com.smhrd.eegbrain.dto.FlaskResponse;
import com.smhrd.eegbrain.dto.InferRequest;
import com.smhrd.eegbrain.dto.InferResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class FlaskClientService {

    private final RestTemplate restTemplate;
    private final String inferUrl;

    public FlaskClientService(RestTemplate restTemplate,
                              @Value("${flask.infer-url}") String inferUrl) {
        this.restTemplate = restTemplate;
        this.inferUrl = inferUrl;
    }

    /** 동기 추론 */
    public InferResponse callInferSync(InferRequest req) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<InferRequest> entity = new HttpEntity<>(req, headers);

        ResponseEntity<InferResponse> resp =
                restTemplate.exchange(inferUrl, HttpMethod.POST, entity, InferResponse.class);

        return resp.getBody();
    }

    /** 비동기 추론 */
    public String callInferAsync(InferRequest req) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<InferRequest> entity = new HttpEntity<>(req, headers);

        ResponseEntity<String> resp =
                restTemplate.exchange(inferUrl, HttpMethod.POST, entity, String.class);

        return resp.getBody();
    }

    /** FlaskResponse로 받기 */
    public FlaskResponse callInferForFlaskResponse(InferRequest req) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<InferRequest> entity = new HttpEntity<>(req, headers);

        ResponseEntity<FlaskResponse> resp =
                restTemplate.exchange(inferUrl, HttpMethod.POST, entity, FlaskResponse.class);

        return resp.getBody();
    }

    /** 2클래스 추론 (CN/AD) */
    public InferResponse callInfer2Class(InferRequest req) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<InferRequest> entity = new HttpEntity<>(req, headers);

        // 2클래스 전용 엔드포인트 호출
        String infer2ClassUrl = inferUrl.replace("/infer", "/infer2class");
        ResponseEntity<InferResponse> resp =
                restTemplate.exchange(infer2ClassUrl, HttpMethod.POST, entity, InferResponse.class);

        return resp.getBody();
    }

    /** 3클래스 추론 (CN/AD/FTD) */
    public InferResponse callInfer3Class(InferRequest req) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<InferRequest> entity = new HttpEntity<>(req, headers);

        // 3클래스 전용 엔드포인트 호출
        String infer3ClassUrl = inferUrl.replace("/infer", "/infer3class");
        ResponseEntity<InferResponse> resp =
                restTemplate.exchange(infer3ClassUrl, HttpMethod.POST, entity, InferResponse.class);

        return resp.getBody();
    }
}
