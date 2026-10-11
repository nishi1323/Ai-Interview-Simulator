package com.aiinterview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InterviewAnswerRequest {
    @NotNull
    private Long questionId;

    @NotBlank
    private String answer;
    private String questionType;
}
