package com.aiinterview.dto;

import java.util.List;

public record CodingChallengeResponse(
        String id,
        String title,
        String prompt,
        String functionName,
        String focus,
        String difficulty,
        String starterCode,
        List<TestCase> tests,
        boolean recommended,
        boolean personalized
) {
    public record TestCase(List<Object> args, Object expected, String label) { }
}