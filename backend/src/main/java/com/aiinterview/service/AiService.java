package com.aiinterview.service;

import com.aiinterview.entity.Resume;
import com.aiinterview.dto.JobRoleMatchResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);
    private final GroqAssistantClient groqAssistantClient;
    private final ObjectMapper objectMapper;

    public AiService() {
        this(null);
    }

    @Autowired
    public AiService(@Autowired(required = false) GroqAssistantClient groqAssistantClient) {
        this.groqAssistantClient = groqAssistantClient;
        this.objectMapper = new ObjectMapper();
    }

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
                .filter(skill -> Set.of("Java", "JavaScript", "TypeScript", "C++", "C#", "Python", "Kotlin", "Go", "SQL", "Rust", "Swift").contains(skill))
                .toList();
        List<String> frameworks = skills.stream()
                .filter(skill -> Set.of("Spring Boot", "React", "Angular", "Vue", "Next.js", "Node.js", "Express", "Django", "Flask", "FastAPI").contains(skill))
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
        String[] candidates = {
                "java", "javascript", "typescript", "c++", "c#", "python", "kotlin", "golang",
                "spring boot", "react", "angular", "vue", "next.js", "node.js", "express",
                "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "kafka", "rabbitmq",
                "docker", "kubernetes", "aws", "azure", "gcp", "github", "ci/cd", "jenkins",
                "rest api", "graphql", "system design", "microservices", "html", "css", "tailwind",
                "hibernate", "jpa", "linux", "terraform", "django", "flask", "fastapi", "rust", "swift", "junit", "mockito"
        };
        List<String> skills = new ArrayList<>();
        for (String item : candidates) {
            if (lower.contains(item)) {
                String label = toLabel(item);
                if (!skills.contains(label)) {
                    skills.add(label);
                }
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
        if (groqAssistantClient != null && groqAssistantClient.isEnabled()) {
            try {
                String role = jobRole == null || jobRole.isBlank() ? "Software Engineer" : jobRole.trim();
                String diff = difficulty == null || difficulty.isBlank() ? "Intermediate" : difficulty.trim();
                String prompt = """
                        Generate one realistic %s interview question for a %s position.
                        Respond ONLY with a single JSON object:
                        {
                          "question": "<the question text>",
                          "type": "technical",
                          "difficulty": "%s"
                        }
                        """.formatted(diff, role, diff);
                String response = groqAssistantClient.chat(List.of(
                        Map.of("role", "system", "content", "You are an interview question generator. Output raw JSON only."),
                        Map.of("role", "user", "content", prompt)
                ), 0.3, 200);
                String clean = response.replaceAll("(?s)^```(?:json)?\\s*", "").replaceAll("(?s)\\s*```$", "").trim();
                Map<String, Object> parsed = objectMapper.readValue(clean, new TypeReference<>() {});
                if (parsed.get("question") != null) {
                    return parsed;
                }
            } catch (Exception ex) {
                log.warn("Groq question generation failed: {}. Using fallback.", ex.getMessage());
            }
        }
        return generateQuestionDeterministic(jobRole, difficulty);
    }

    public List<String> generateQuestionsForInterview(String jobRole, String interviewType, String difficulty, int count, String resumeText) {
        if (groqAssistantClient != null && groqAssistantClient.isEnabled()) {
            try {
                String role = jobRole == null || jobRole.isBlank() ? "Software Engineer" : jobRole.trim();
                String type = interviewType == null || interviewType.isBlank() ? "Technical" : interviewType.trim();
                String diff = difficulty == null || difficulty.isBlank() ? "Intermediate" : difficulty.trim();
                String resumeSnippet = resumeText != null && !resumeText.isBlank()
                        ? "Candidate resume background: " + resumeText.substring(0, Math.min(600, resumeText.length()))
                        : "";
                String prompt = """
                        Generate %d distinct, high-quality %s %s interview questions for a %s position.
                        %s
                        Respond ONLY with a single JSON object containing an array:
                        {
                          "questions": [
                            "<question 1>",
                            "<question 2>"
                          ]
                        }
                        """.formatted(count, diff, type, role, resumeSnippet);
                String response = groqAssistantClient.chat(List.of(
                        Map.of("role", "system", "content", "You are an interview question generator. Output raw JSON only."),
                        Map.of("role", "user", "content", prompt)
                ), 0.4, 600);
                String clean = response.replaceAll("(?s)^```(?:json)?\\s*", "").replaceAll("(?s)\\s*```$", "").trim();
                Map<String, Object> parsed = objectMapper.readValue(clean, new TypeReference<>() {});
                Object qList = parsed.get("questions");
                if (qList instanceof List<?> list && !list.isEmpty()) {
                    List<String> result = new ArrayList<>();
                    for (Object item : list) {
                        if (item != null && !item.toString().isBlank()) {
                            result.add(item.toString().trim());
                        }
                    }
                    if (result.size() >= count) {
                        return result.subList(0, count);
                    }
                }
            } catch (Exception ex) {
                log.warn("Groq batch question generation failed: {}. Using fallback bank.", ex.getMessage());
            }
        }
        return Collections.emptyList();
    }

    private Map<String, Object> generateQuestionDeterministic(String jobRole, String difficulty) {
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
        return evaluateAnswer(null, answer);
    }

    public Map<String, Object> evaluateAnswer(String questionPrompt, String answer) {
        if (groqAssistantClient != null && groqAssistantClient.isEnabled()) {
            try {
                return evaluateAnswerWithGroq(questionPrompt, answer);
            } catch (Exception ex) {
                log.warn("Groq answer evaluation failed: {}. Falling back to deterministic evaluation.", ex.getMessage());
            }
        }
        return evaluateAnswerDeterministic(questionPrompt, answer);
    }

    private Map<String, Object> evaluateAnswerWithGroq(String questionPrompt, String answer) {
        String q = questionPrompt == null || questionPrompt.isBlank()
                ? "General technical interview question"
                : questionPrompt.trim();
        String a = answer == null ? "" : answer.trim();

        String prompt = """
                Evaluate this interview answer realistically as a senior technical interviewer.
                Question: %s
                Candidate Answer: %s

                Respond ONLY with a single JSON object containing these exact keys:
                {
                  "score": <overall score integer 0-100>,
                  "technicalScore": <technical depth score integer 0-100>,
                  "communicationScore": <communication clarity integer 0-100>,
                  "relevance": <relevance score integer 0-100>,
                  "problemSolvingScore": <problem solving score integer 0-100>,
                  "deliveryScore": <completeness and tone integer 0-100>,
                  "feedback": "<concise paragraph highlighting strengths and specific improvement advice>",
                  "strengths": ["<strength 1>", "<strength 2>"],
                  "weaknesses": ["<area to improve 1>", "<area to improve 2>"]
                }
                """.formatted(q, a);

        String json = groqAssistantClient.chat(List.of(
                Map.of("role", "system", "content", "You are an expert technical interviewer evaluator. Output raw JSON only."),
                Map.of("role", "user", "content", prompt)
        ), 0.2, 500);

        String clean = json.replaceAll("(?s)^```(?:json)?\\s*", "").replaceAll("(?s)\\s*```$", "").trim();
        try {
            Map<String, Object> parsed = objectMapper.readValue(clean, new TypeReference<>() {});
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("score", safeScore(parsed.get("score"), 70));
            result.put("technicalScore", safeScore(parsed.get("technicalScore"), 68));
            result.put("communicationScore", safeScore(parsed.get("communicationScore"), 72));
            result.put("relevance", safeScore(parsed.get("relevance"), 75));
            result.put("problemSolvingScore", safeScore(parsed.get("problemSolvingScore"), 70));
            result.put("deliveryScore", safeScore(parsed.get("deliveryScore"), 75));
            result.put("feedback", String.valueOf(parsed.getOrDefault("feedback", "Good effort. Structure your answer with concrete project examples and trade-offs.")));
            result.put("strengths", parsed.get("strengths") instanceof List<?> list ? list : List.of("Clear explanation", "Relevant technical terms"));
            result.put("weaknesses", parsed.get("weaknesses") instanceof List<?> list ? list : List.of("Add practical examples", "Discuss edge cases"));
            return result;
        } catch (Exception ex) {
            log.warn("Failed to parse Groq evaluation JSON: {}. Using deterministic score.", clean);
            return evaluateAnswerDeterministic(questionPrompt, answer);
        }
    }

    private int safeScore(Object value, int fallback) {
        if (value instanceof Number num) {
            return boundedScore(num.intValue());
        }
        return fallback;
    }

    private Map<String, Object> evaluateAnswerDeterministic(String questionPrompt, String answer) {
        String text = answer == null ? "" : answer.toLowerCase();
        int words = text.isBlank() ? 0 : text.trim().split("\\s+").length;
        boolean hasDomainTerms = containsAny(text, "java", "spring", "api", "database", "design", "react", "sql", "docker", "microservice", "class", "function", "data");
        boolean hasExample = containsAny(text, "example", "project", "for instance", "we used", "i implemented");
        boolean hasReasoning = containsAny(text, "because", "therefore", "trade-off", "approach", "so that", "since");
        boolean considersRisks = containsAny(text, "edge case", "failure", "risk", "test", "trade-off", "scale");

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
        result.put("feedback", "Your answer is directionally correct. Add a practical project example, discuss architectural trade-offs, and mention edge cases to demonstrate depth.");
        result.put("strengths", List.of("Relevant domain knowledge", "Clear terminology"));
        result.put("weaknesses", List.of("Need more technical depth", "Add edge-case examples"));
        return result;
    }

    public Map<String, Object> analyzeSpeech(String transcript, Integer durationSeconds) {
        String text = transcript == null ? "" : transcript;
        int seconds = durationSeconds == null ? 60 : Math.max(1, durationSeconds);
        int words = text.isBlank() ? 0 : text.trim().split("\\s+").length;
        int wpm = Math.max(50, Math.round(words / (seconds / 60f)));

        Map<String, Integer> fillerWords = new HashMap<>();
        String[] fillers = {"um", "uh", "like", "basically", "actually", "you know", "so", "right"};
        for (String filler : fillers) {
            int count = countOccurrences(text.toLowerCase(), filler);
            if (count > 0) {
                fillerWords.put(filler, count);
            }
        }

        int totalFillers = fillerWords.values().stream().mapToInt(Integer::intValue).sum();
        int delivery = Math.max(50, Math.min(100, 92 - (totalFillers * 3) - (wpm > 180 || wpm < 80 ? 12 : 0)));

        String feedback;
        if (totalFillers > 5) {
            feedback = "Confidence/Delivery Estimate: Your pacing is " + wpm + " WPM. Aim to reduce filler words (" + totalFillers + " detected) by pausing deliberately before answering.";
        } else if (wpm > 170) {
            feedback = "Confidence/Delivery Estimate: Your articulation is clear, but pacing (" + wpm + " WPM) is fast. Slow down slightly to emphasize key technical takeaways.";
        } else if (wpm < 90) {
            feedback = "Confidence/Delivery Estimate: Your response is thoughtful (" + wpm + " WPM), but picking up the cadence slightly will sound more energetic and confident.";
        } else {
            feedback = "Confidence/Delivery Estimate: Excellent cadence (" + wpm + " WPM) with minimal filler words. Articulate structure with clear examples.";
        }

        Map<String, Object> result = new HashMap<>();
        result.put("speakingDurationSeconds", seconds);
        result.put("wordCount", words);
        result.put("wordsPerMinute", wpm);
        result.put("fillerWords", fillerWords);
        result.put("confidenceDeliveryEstimate", delivery);
        result.put("feedback", feedback);
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
            case "vue" -> "Vue";
            case "next.js" -> "Next.js";
            case "node.js" -> "Node.js";
            case "express" -> "Express";
            case "sql" -> "SQL";
            case "mysql" -> "MySQL";
            case "postgresql" -> "PostgreSQL";
            case "mongodb" -> "MongoDB";
            case "redis" -> "Redis";
            case "elasticsearch" -> "Elasticsearch";
            case "kafka" -> "Kafka";
            case "rabbitmq" -> "RabbitMQ";
            case "python" -> "Python";
            case "docker" -> "Docker";
            case "kubernetes" -> "Kubernetes";
            case "aws" -> "AWS";
            case "azure" -> "Azure";
            case "gcp" -> "GCP";
            case "github" -> "GitHub";
            case "ci/cd" -> "CI/CD";
            case "jenkins" -> "Jenkins";
            case "terraform" -> "Terraform";
            case "linux" -> "Linux";
            case "rest api" -> "REST API";
            case "graphql" -> "GraphQL";
            case "system design" -> "System Design";
            case "microservices" -> "Microservices";
            case "html" -> "HTML";
            case "css" -> "CSS";
            case "tailwind" -> "Tailwind CSS";
            case "hibernate" -> "Hibernate";
            case "jpa" -> "JPA";
            case "django" -> "Django";
            case "flask" -> "Flask";
            case "fastapi" -> "FastAPI";
            case "rust" -> "Rust";
            case "swift" -> "Swift";
            case "junit" -> "JUnit";
            case "mockito" -> "Mockito";
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
