package com.aiinterview.dto;

import com.aiinterview.entity.Question;

public record InterviewQuestionResponse(Long id, String prompt, String type, Integer questionOrder, boolean answered) {
    public static InterviewQuestionResponse from(Question question, boolean answered) {
        return new InterviewQuestionResponse(
                question.getId(),
                question.getPrompt(),
                question.getType(),
                question.getQuestionOrder(),
                answered
        );
    }
}