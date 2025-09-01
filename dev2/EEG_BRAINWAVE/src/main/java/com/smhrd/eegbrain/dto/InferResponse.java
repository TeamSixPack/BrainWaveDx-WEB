package com.smhrd.eegbrain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class InferResponse {

    @JsonProperty("status")
    private String status;

    @JsonProperty("result")
    private InferResult result;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public InferResult getResult() { return result; }
    public void setResult(InferResult result) { this.result = result; }
}
