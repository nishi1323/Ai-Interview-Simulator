package com.aiinterview.service;

import com.aiinterview.entity.Interview;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CodingPracticeServiceTest {
    private final CodingPracticeService codingPracticeService = new CodingPracticeService();

    @Test
    void recommendsChallengeForWeakestProblemSolvingScore() {
        Interview interview = new Interview();
        interview.setTechnicalScore(82);
        interview.setProblemSolvingScore(58);
        interview.setRelevanceScore(75);

        var recommendations = codingPracticeService.recommendations(interview);

        assertThat(recommendations).hasSize(4);
        assertThat(recommendations.get(0).id()).isEqualTo("longest-unique-substring");
        assertThat(recommendations.get(0).recommended()).isTrue();
        assertThat(recommendations.get(0).personalized()).isTrue();
        assertThat(recommendations.stream().filter(challenge -> challenge.recommended())).hasSize(1);
    }

    @Test
    void recommendsFoundationalChallengeBeforeAnInterviewExists() {
        var recommendations = codingPracticeService.recommendations(null);

        assertThat(recommendations.get(0).id()).isEqualTo("longest-unique-substring");
        assertThat(recommendations.get(0).recommended()).isTrue();
        assertThat(recommendations.get(0).personalized()).isFalse();
    }
}