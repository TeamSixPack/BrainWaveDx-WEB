package com.smhrd.eegbrain.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CallbackPayload {

    @JsonProperty("job_id")
    private String jobId;

    @JsonProperty("result")
    private InferResult result;

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }

    public InferResult getResult() { return result; }
    public void setResult(InferResult result) { this.result = result; }
}