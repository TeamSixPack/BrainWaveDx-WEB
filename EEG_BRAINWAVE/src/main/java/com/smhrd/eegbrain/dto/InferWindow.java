package com.smhrd.eegbrain.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class InferWindow {
    @JsonProperty("start")
    private Integer start;

    @JsonProperty("need")
    private Integer need;

    public Integer getStart() { return start; }
    public void setStart(Integer start) { this.start = start; }

    public Integer getNeed() { return need; }
    public void setNeed(Integer need) { this.need = need; }
}
