package com.smhrd.eegbrain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FlaskResponse {

    private String status;          // "ok" | "accepted" | "error"
    private InferResult result;     // 동기 호출 시 채워짐

    private String error;           // 에러 메시지
    @JsonProperty("job_id")
    private String jobId;           // 비동기 accepted 시 반환
}
