package com.aiinterview.dto;

import com.aiinterview.entity.Interview;
import java.time.LocalDateTime;
import java.util.List;

public record InterviewResponse(
        Long id,
    String jobRole,
        String interviewType,
        String difficulty,
        Integer totalQuestions,
        String mode,
        Integer overallScore,
        Integer technicalScore,
        Integer communicationScore,
        Integer relevanceScore,
        Integer problemSolvingScore,
        Integer deliveryScore,
        String status,
        LocalDateTime createdAt,
        LocalDateTime completedAt,
        List<InterviewQuestionResponse> questions
) {
    public static InterviewResponse from(Interview interview, List<InterviewQuestionResponse> questions) {
        return new InterviewResponse(
                interview.getId(),
                interview.getJobRole() == null ? null : interview.getJobRole().getTitle(),
                interview.getInterviewType(),
                interview.getDifficulty(),
                interview.getTotalQuestions(),
                interview.getMode(),
                interview.getOverallScore(),
                interview.getTechnicalScore(),
                interview.getCommunicationScore(),
                interview.getRelevanceScore(),
                interview.getProblemSolvingScore(),
                interview.getDeliveryScore(),
                interview.getStatus(),
                interview.getCreatedAt(),
                interview.getCompletedAt(),
                questions
        );
    }
}