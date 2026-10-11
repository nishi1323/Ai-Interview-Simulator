package com.aiinterview.dto;

import lombok.Data;

@Data
public class InterviewCreateRequest {
    private String interviewType;
    private String difficulty;
    private Integer totalQuestions;
    private String mode;
    private String jobRole;
    private String experienceLevel;
}
