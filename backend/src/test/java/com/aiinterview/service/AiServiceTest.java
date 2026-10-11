package com.aiinterview.service;

import com.aiinterview.entity.Resume;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AiServiceTest {
    private final AiService aiService = new AiService();

    @Test
    void extractsSkillsAndLabeledSectionsFromResumeText() {
        Resume resume = new Resume();
        resume.setExtractedText("""
                Morgan Doe
                morgan@example.com
                Skills
                Java, Spring Boot
                Education
                B.Sc. Computer Science
                Projects
                Inventory API built with Java
                Certifications
                AWS Certified Developer
                """);

        Map<String, Object> analysis = aiService.analyzeResume(resume);

        assertThat(analysis.get("candidateName")).isEqualTo("Morgan Doe");
        assertThat(analysis.get("skills")).isEqualTo(List.of("Java", "Spring Boot", "AWS"));
        assertThat(analysis.get("education")).isEqualTo("B.Sc. Computer Science");
        assertThat(analysis.get("projects")).isEqualTo(List.of("Inventory API built with Java"));
        assertThat(analysis.get("certifications")).isEqualTo(List.of("AWS Certified Developer"));
    }

    @Test
    void doesNotInventSkillsOrProjectsWhenResumeDoesNotContainThem() {
        Resume resume = new Resume();
        resume.setExtractedText("Jordan Lee\nProfile\nInterested in building reliable software.");

        Map<String, Object> analysis = aiService.analyzeResume(resume);

        assertThat(analysis.get("skills")).isEqualTo(List.of());
        assertThat(analysis.get("projects")).isEqualTo(List.of());
        assertThat(analysis.get("education")).isEqualTo("");
    }

    @Test
    void calculatesJobMatchFromActualSkillOverlap() {
        var match = aiService.matchResumeToJob(
                "Backend Developer",
                "candidate.pdf",
                List.of("Java", "SQL"),
                "Need Java, Spring Boot and SQL experience."
        );

        assertThat(match.matchPercent()).isEqualTo(67);
        assertThat(match.matchingSkills()).isEqualTo(List.of("Java", "SQL"));
        assertThat(match.missingSkills()).isEqualTo(List.of("Spring Boot"));
    }
}