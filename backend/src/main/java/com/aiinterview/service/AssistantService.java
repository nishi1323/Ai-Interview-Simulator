package com.aiinterview.service;

import com.aiinterview.dto.AssistantChatResponse;
import com.aiinterview.dto.AssistantChatTurn;
import com.aiinterview.entity.Interview;
import com.aiinterview.entity.Resume;
import com.aiinterview.entity.User;
import com.aiinterview.exception.ResourceNotFoundException;
import com.aiinterview.repository.InterviewRepository;
import com.aiinterview.repository.ResumeRepository;
import com.aiinterview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AssistantService {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final InterviewRepository interviewRepository;
    private final AiService aiService;
    private final OpenAiAssistantClient openAiAssistantClient;

    @Transactional(readOnly = true)
    public AssistantChatResponse respond(String email, String message, List<AssistantChatTurn> history) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        Optional<Resume> resume = resumeRepository.findFirstByUserOrderByCreatedAtDesc(user);
        List<Interview> interviews = interviewRepository.findByUser(user);
        Optional<Interview> latestInterview = interviews.stream()
                .max(Comparator.comparing(Interview::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder())));
        Optional<Interview> latestCompletedInterview = interviews.stream()
                .filter(interview -> "COMPLETED".equals(interview.getStatus()))
                .max(Comparator.comparing(Interview::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder())));

        String firstName = user.getName() == null || user.getName().isBlank()
                ? "there"
                : user.getName().trim().split("\\s+")[0];
        List<String> skills = resume.map(this::skillsFromResume).orElse(List.of());
        String role = latestInterview
                .map(Interview::getJobRole)
                .map(jobRole -> jobRole.getTitle())
                .filter(title -> title != null && !title.isBlank())
                .orElse("Software Engineer");

        if (openAiAssistantClient.isEnabled()) {
            return new AssistantChatResponse(openAiAssistantClient.generateReply(
                    message,
                    buildCandidateContext(skills, role, latestCompletedInterview, user.getExperienceLevel()),
                    history == null ? List.of() : history), "AI");
        }

        return new AssistantChatResponse(buildReply(
                firstName, message, resume.isPresent(), skills, role,
                latestCompletedInterview), "BUILT_IN");
    }

    private String buildCandidateContext(List<String> skills, String role,
                                         Optional<Interview> latestCompletedInterview, String experienceLevel) {
        String experience = experienceLevel == null || experienceLevel.isBlank()
                ? "not provided"
                : experienceLevel;
        String resumeSkills = skills.isEmpty() ? "not available" : String.join(", ", skills);
        String recentResults = latestCompletedInterview
                .map(interview -> "Latest completed interview score: " + scoreText(interview.getOverallScore())
                        + ". " + weakestDimension(interview))
                .orElse("No completed interview scores are available.");
        return "Target role: " + role + ". Experience level: " + experience
                + ". Skills extracted from the latest resume: " + resumeSkills + ". " + recentResults;
    }

    private List<String> skillsFromResume(Resume resume) {
        if (resume.getSkills() != null && !resume.getSkills().isBlank()) {
            return List.of(resume.getSkills().split("\\s*,\\s*"));
        }
        return aiService.extractSkills(resume.getExtractedText());
    }

    private String buildReply(String firstName, String message, boolean hasResume, List<String> skills,
                              String role, Optional<Interview> latestCompletedInterview) {
        String question = message.toLowerCase(Locale.ROOT);
        String greeting = "Hi " + firstName + " — ";

        if (containsAny(question, "resume", "cv", "project", "profile")) {
            if (!hasResume) {
                return greeting + "I don't have a resume on your account yet, so I can't give resume-specific feedback. "
                        + "Upload a selectable-text PDF first, then ask me to review your skills or project descriptions.";
            }
            if (skills.isEmpty()) {
                return greeting + "I found your latest resume, but couldn't reliably identify supported technical skills in it. "
                        + "Try a text-based PDF with a clearly labeled Skills section. I can still help you plan interview practice for "
                        + role + ".";
            }
            return greeting + "your latest resume lists " + joinSkills(skills) + ". For a stronger "
                    + role + " application, make each project bullet show what you built, the tools you used, and a measurable result. "
                    + "I only make suggestions from the resume information this app can extract.";
        }

        if (containsAny(question, "score", "weak", "improv", "performance", "result")) {
            if (latestCompletedInterview.isEmpty()) {
                return greeting + "you don't have a completed interview score yet. Try a " + role
                        + " practice interview and come back; I can use its scored dimensions to suggest a specific next step.";
            }
            Interview interview = latestCompletedInterview.get();
            return greeting + "your latest completed " + role + " interview scored "
                    + scoreText(interview.getOverallScore()) + ". " + weakestDimension(interview)
                    + " Use that as your focus for your next practice session rather than trying to improve everything at once.";
        }

        if (containsAny(question, "interview", "practice", "question", "mock")) {
            String focus = latestCompletedInterview
                    .map(this::weakestDimension)
                    .orElse("Start with a short practice session to establish a baseline.");
            return greeting + "for your " + role + " goal, practice explaining one project from your resume using the situation, "
                    + "your actions, and the outcome. " + focus + " You can start a role-focused session from Interview setup.";
        }

        if (containsAny(question, "roadmap", "study", "learn", "plan", "next step")) {
            String focus = latestCompletedInterview
                    .map(this::weakestDimension)
                    .orElse("Begin with fundamentals for your target role, then take a practice interview to find a useful focus area.");
            String skillNote = skills.isEmpty() ? "" : " Your resume already mentions " + joinSkills(skills) + ".";
            return greeting + "for " + role + ", keep the next week focused: spend two short sessions on one topic, "
                    + "build or explain a small example, then practice answering a related interview question." + skillNote
                    + " " + focus + " The Learning plan page has your saved improvement tasks.";
        }

        return "I can't give an accurate answer to \"" + message.trim() + "\" because the AI provider is not configured. "
                + "Set OPENAI_API_KEY on the backend and restart it for adaptive answers. Without a provider, I can only "
                + "give limited rule-based guidance about your saved resume, interview scores, and practice plan.";
    }

    private String weakestDimension(Interview interview) {
        List<DimensionScore> scores = List.of(
                new DimensionScore("technical", interview.getTechnicalScore()),
                new DimensionScore("communication", interview.getCommunicationScore()),
                new DimensionScore("relevance", interview.getRelevanceScore()),
                new DimensionScore("problem-solving", interview.getProblemSolvingScore()),
                new DimensionScore("delivery", interview.getDeliveryScore())
        );
        return scores.stream()
                .filter(score -> score.value() != null)
                .min(Comparator.comparingInt(score -> score.value()))
                .map(score -> "Your lowest scored area was " + score.name() + " (" + score.value()
                        + "/100), so focus your next practice on that.")
                .orElse("Try another practice interview to get more detailed feedback.");
    }

    private String scoreText(Integer score) {
        return score == null ? "not available" : score + "%";
    }

    private String joinSkills(List<String> skills) {
        if (skills.size() == 1) {
            return skills.get(0);
        }
        return String.join(", ", skills.subList(0, skills.size() - 1))
                + " and " + skills.get(skills.size() - 1);
    }

    private boolean containsAny(String source, String... terms) {
        for (String term : terms) {
            if (source.contains(term)) {
                return true;
            }
        }
        return false;
    }

    private record DimensionScore(String name, Integer value) {
    }
}
