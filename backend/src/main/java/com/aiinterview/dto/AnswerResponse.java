package com.aiinterview.dto;

import com.aiinterview.entity.Answer;

public record AnswerResponse(
        Long id,
        Long questionId,
        Integer score,
        Integer communicationScore,
        String feedback
) {
    public static AnswerResponse from(Answer answer) {
        return new AnswerResponse(
                answer.getId(),
                answer.getQuestion().getId(),
                answer.getScore(),
                answer.getCommunicationScore(),
                answer.getFeedback()
        );
    }
}