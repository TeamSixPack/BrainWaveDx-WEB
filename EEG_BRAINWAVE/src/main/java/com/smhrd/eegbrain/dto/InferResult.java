package com.smhrd.eegbrain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class InferResult {

    @JsonProperty("channels_used")
    private List<String> channelsUsed;

    @JsonProperty("file_path")
    private String filePath;

    @JsonProperty("n_segments")
    private Integer nSegments;

    @JsonProperty("prob_mean")
    private Map<String, Double> probMean;

    @JsonProperty("segment_accuracy")
    private Double segmentAccuracy;

    @JsonProperty("segment_counts")
    private Map<String, Integer> segmentCounts;

    @JsonProperty("segment_majority_index")
    private Integer segmentMajorityIndex;

    @JsonProperty("segment_majority_label")
    private String segmentMajorityLabel;

    @JsonProperty("subject_id")
    private String subjectId;

    @JsonProperty("window")
    private Map<String, Integer> window;
}
