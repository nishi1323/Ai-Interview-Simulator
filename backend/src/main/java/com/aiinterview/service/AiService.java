package com.aiinterview.service;

import com.aiinterview.entity.Resume;
import com.aiinterview.dto.JobRoleMatchResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiService {

    public Map<String, Object> analyzeResume(Resume resume) {
        String text = resume == null || resume.getExtractedText() == null
                ? ""
                : resume.getExtractedText().replace('\r', '\n').replaceAll("[\\t\\f ]+", " ").trim();
        List<String> lines = Arrays.stream(text.split("\\n+"))
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .toList();

        List<String> skills = extractSkills(text);

        List<String> education = extractSection(lines, Set.of("education", "academic background", "academic qualifications"));
        List<String> projects = extractSection(lines, Set.of("projects", "personal projects", "project experience"));
        List<String> experience = extractSection(lines, Set.of("experience", "work experience", "professional experience", "employment history"));
        List<String> internships = extractSection(lines, Set.of("internship", "internships"));
        List<String> certifications = extractSection(lines, Set.of("certification", "certifications", "licenses and certifications"));

        List<String> programmingLanguages = skills.stream()
                .filter(skill -> Set.of("Java", "JavaScript", "TypeScript", "C++", "C#", "Python", "Kotlin", "Go", "SQL").contains(skill))
                .toList();
        List<String> frameworks = skills.stream()
                .filter(skill -> Set.of("Spring Boot", "React", "Angular", "Node.js").contains(skill))
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("candidateName", extractCandidateName(lines));
        result.put("education", String.join(", ", education));
        result.put("skills", skills);
        result.put("programmingLanguages", programmingLanguages);
        result.put("frameworks", frameworks);
        result.put("projects", projects);
        result.put("internships", internships);
        result.put("certifications", certifications);
        result.put("experience", String.join(" ", experience));
        return result;
    }

    public List<String> extractSkills(String text) {
        String lower = text == null ? "" : text.toLowerCase();
        String[] candidates = {"java", "javascript", "typescript", "c++", "c#", "python", "kotlin", "golang", "spring boot", "react", "angular", "node.js", "sql", "mysql", "postgresql", "mongodb", "docker", "aws", "rest api", "system design", "microservices"};
        List<String> skills = new ArrayList<>();
        for (String item : candidates) {
            if (lower.contains(item)) {
                skills.add(toLabel(item));
            }
        }
        return skills;
    }

    public JobRoleMatchResponse matchResumeToJob(String jobRole, String resumeFilename,
                                                 List<String> resumeSkills, String jobDescription) {
        List<String> requiredSkills = extractSkills(jobDescription);
        if (requiredSkills.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No supported technical skills were identified in the job description.");
        }
        List<String> matchingSkills = requiredSkills.stream()
                .filter(required -> resumeSkills.stream().anyMatch(required::equalsIgnoreCase))
                .toList();
        List<String> missingSkills = requiredSkills.stream()
                .filter(required -> matchingSkills.stream().noneMatch(required::equalsIgnoreCase))
                .toList();
        int matchPercent = Math.round(matchingSkills.size() * 100f / requiredSkills.size());
        return new JobRoleMatchResponse(jobRole, resumeFilename, matchPercent, requiredSkills, matchingSkills, missingSkills);
    }

    private String extractCandidateName(List<String> lines) {
        for (String line : lines.stream().limit(5).toList()) {
            String lower = line.toLowerCase();
            if (line.length() <= 80 && !line.contains("@") && !lower.matches(".*\\b(resume|curriculum vitae|cv)\\b.*")
                    && !isSectionHeader(line)) {
                return line;
            }
        }
        return "Candidate";
    }

    private List<String> extractSection(List<String> lines, Set<String> headings) {
        for (int index = 0; index < lines.size(); index++) {
            String inlineContent = sectionContent(lines.get(index), headings);
            if (inlineContent == null) {
                continue;
            }

            List<String> section = new ArrayList<>();
            if (!inlineContent.isBlank()) {
                section.add(inlineContent);
            }
            for (int contentIndex = index + 1; contentIndex < lines.size() && section.size() < 8; contentIndex++) {
                String line = lines.get(contentIndex);
                if (isSectionHeader(line)) {
                    break;
                }
                section.add(line);
            }
            return section;
        }
        return List.of();
    }

    private String sectionContent(String line, Set<String> headings) {
        String lower = line.toLowerCase();
        for (String heading : headings) {
            if (lower.equals(heading)) {
                return "";
            }
            if (lower.startsWith(heading + ":") || lower.startsWith(heading + " -")) {
                return line.substring(heading.length()).replaceFirst("^\\s*[:\\-]\\s*", "").trim();
            }
        }
        return null;
    }

    private boolean isSectionHeader(String line) {
        String normalized = line.toLowerCase().replaceAll("[^a-z ]", "").trim();
        return Set.of("education", "academic background", "academic qualifications", "projects", "personal projects",
                "project experience", "experience", "work experience", "professional experience", "employment history",
                "internship", "internships", "certification", "certifications", "licenses and certifications",
                "skills", "technical skills", "summary", "professional summary", "profile", "languages").contains(normalized);
    }

    public Map<String, Object> generateQuestion(String jobRole, String difficulty, String resumeText) {
        String role = jobRole == null || jobRole.isBlank() ? "Software Engineer" : jobRole;
        String question;
        if (role.toLowerCase().contains("java")) {
            question = "Explain polymorphism in Java and provide a practical example from a real project.";
        } else if (role.toLowerCase().contains("frontend") || role.toLowerCase().contains("react")) {
            question = "How would you optimize the performance of a React application with large data sets?";
        } else if (role.toLowerCase().contains("data")) {
            question = "How would you handle missing values and outliers before model training?";
        } else if (role.toLowerCase().contains("devops")) {
            question = "Describe how you would design a CI/CD pipeline for a microservices application.";
        } else {
            question = "Explain how you would design a scalable backend API for a high-traffic application.";
        }

        Map<String, Object> result = new HashMap<>();
        result.put("question", question);
        result.put("type", "technical");
        result.put("difficulty", difficulty == null ? "Intermediate" : difficulty);
        return result;
    }

    public Map<String, Object> evaluateAnswer(String answer) {
        String text = answer == null ? "" : answer.toLowerCase();
        int words = text.isBlank() ? 0 : text.trim().split("\\s+").length;
        boolean hasDomainTerms = containsAny(text, "java", "spring", "api", "database", "design", "react", "sql");
        boolean hasExample = containsAny(text, "example", "project", "for instance");
        boolean hasReasoning = containsAny(text, "because", "therefore", "trade-off", "approach", "so that");
        boolean considersRisks = containsAny(text, "edge case", "failure", "risk", "test", "trade-off");

        int score = boundedScore(60 + (hasDomainTerms ? 15 : 0) + (hasExample ? 10 : 0)
                + (hasReasoning ? 10 : 0) + (words > 40 ? 5 : 0));
        int technical = boundedScore(55 + (hasDomainTerms ? 20 : 0) + (hasReasoning ? 10 : 0) + (words > 30 ? 10 : 0));
        int communication = boundedScore(55 + Math.min(25, words / 4) + (hasExample ? 10 : 0));
        int relevance = boundedScore(55 + (hasDomainTerms ? 20 : 0) + (hasExample ? 15 : 0));
        int problemSolving = boundedScore(55 + (hasReasoning ? 20 : 0) + (considersRisks ? 15 : 0) + (hasExample ? 10 : 0));
        int delivery = boundedScore(70 + (hasReasoning ? 10 : 0) + (hasExample ? 10 : 0) - Math.min(20, countOccurrences(text, "um") * 3));

        Map<String, Object> result = new HashMap<>();
        result.put("score", Math.min(100, score));
        result.put("technicalScore", technical);
        result.put("communicationScore", communication);
        result.put("relevance", relevance);
        result.put("problemSolvingScore", problemSolving);
        result.put("deliveryScore", delivery);
        result.put("feedback", "Your answer is directionally correct. Add a practical example, discuss trade-offs, and explain edge cases to improve depth.");
        result.put("strengths", List.of("Relevant domain knowledge", "Clear terminology"));
        result.put("weaknesses", List.of("Need more technical depth", "Add edge-case examples"));
        return result;
    }

    public Map<String, Object> analyzeSpeech(String transcript, Integer durationSeconds) {
        String text = transcript == null ? "" : transcript;
        int seconds = durationSeconds == null ? 60 : durationSeconds;
        int words = text.isBlank() ? 0 : text.trim().split("\\s+").length;
        int wpm = seconds > 0 ? Math.max(60, Math.round(words / (seconds / 60f))) : 110;

        Map<String, Integer> fillerWords = new HashMap<>();
        String[] fillers = {"um", "uh", "like", "basically", "actually", "you know", "so"};
        for (String filler : fillers) {
            int count = countOccurrences(text.toLowerCase(), filler);
            if (count > 0) {
                fillerWords.put(filler, count);
            }
        }

        int delivery = Math.max(50, 90 - fillerWords.values().stream().mapToInt(Integer::intValue).sum() * 2);

        Map<String, Object> result = new HashMap<>();
        result.put("speakingDurationSeconds", seconds);
        result.put("wordCount", words);
        result.put("wordsPerMinute", wpm);
        result.put("fillerWords", fillerWords);
        result.put("confidenceDeliveryEstimate", Math.min(100, delivery));
        result.put("feedback", "Confidence/Delivery Estimate: your pace is acceptable, but reducing filler words and structuring your answer will improve clarity.");
        return result;
    }

    private String toLabel(String value) {
        return switch (value) {
            case "java" -> "Java";
            case "javascript" -> "JavaScript";
            case "typescript" -> "TypeScript";
            case "c++" -> "C++";
            case "c#" -> "C#";
            case "kotlin" -> "Kotlin";
            case "golang" -> "Go";
            case "spring boot" -> "Spring Boot";
            case "react" -> "React";
            case "angular" -> "Angular";
            case "node.js" -> "Node.js";
            case "sql" -> "SQL";
            case "mysql" -> "MySQL";
            case "postgresql" -> "PostgreSQL";
            case "mongodb" -> "MongoDB";
            case "python" -> "Python";
            case "docker" -> "Docker";
            case "aws" -> "AWS";
            case "rest api" -> "REST API";
            case "system design" -> "System Design";
            case "microservices" -> "Microservices";
            default -> value;
        };
    }

    private int countOccurrences(String source, String token) {
        if (source == null || source.isBlank()) {
            return 0;
        }
        int count = 0;
        int idx = 0;
        while ((idx = source.indexOf(token, idx)) != -1) {
            count++;
            idx += token.length();
        }
        return count;
    }

    private boolean containsAny(String source, String... terms) {
        for (String term : terms) {
            if (source.contains(term)) {
                return true;
            }
        }
        return false;
    }

    private int boundedScore(int score) {
        return Math.max(0, Math.min(100, score));
    }
}
