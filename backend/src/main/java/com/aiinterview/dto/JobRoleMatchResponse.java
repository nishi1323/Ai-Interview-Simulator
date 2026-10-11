package com.aiinterview.dto;

import java.util.List;

public record JobRoleMatchResponse(
        String jobRole,
        String resumeFilename,
        Integer matchPercent,
        List<String> requiredSkills,
        List<String> matchingSkills,
        List<String> missingSkills
) {
}