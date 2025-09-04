package com.smhrd.eegbrain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InferRequest {

    /** 예: dataset/sub-044/eeg/sub-044_task-eyesclosed_eeg.set */
    @NotBlank
    @JsonProperty("file_path")
    private String filePath;

    /** 옵션: "CN" | "AD" | "FTD" */
    @JsonProperty("true_label")
    private String trueLabel;

    /** 옵션: 없으면 Flask가 경로에서 sub-XXX 추출 */
    @JsonProperty("subject_id")
    private String subjectId;

    /** 옵션: 콜백 받을 URL */
    @JsonProperty("callback_url")
    private String callbackUrl;

    /** 옵션: 기본 true — 2분 미만이면 에러 */
    @JsonProperty("enforce_two_minutes")
    private Boolean enforceTwoMinutes = Boolean.TRUE;
}
