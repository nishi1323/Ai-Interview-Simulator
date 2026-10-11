package com.aiinterview.service;

import com.aiinterview.dto.InterviewAnswerRequest;
import com.aiinterview.dto.InterviewCreateRequest;
import com.aiinterview.dto.InterviewQuestionResponse;
import com.aiinterview.dto.InterviewResponse;
import com.aiinterview.entity.Answer;
import com.aiinterview.entity.Interview;
import com.aiinterview.entity.JobRole;
import com.aiinterview.entity.Question;
import com.aiinterview.entity.User;
import com.aiinterview.exception.ResourceNotFoundException;
import com.aiinterview.dto.AnswerResponse;
import com.aiinterview.repository.AnswerRepository;
import com.aiinterview.repository.InterviewRepository;
import com.aiinterview.repository.JobRoleRepository;
import com.aiinterview.repository.QuestionRepository;
import com.aiinterview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final JobRoleRepository jobRoleRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final AiService aiService;

    @Transactional
    public Interview createInterview(String email, InterviewCreateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String roleTitle = request.getJobRole() == null || request.getJobRole().isBlank()
                ? "Software Engineer"
                : request.getJobRole().trim();
        JobRole jobRole = jobRoleRepository.findByTitle(roleTitle).orElseGet(() -> {
            JobRole newRole = new JobRole();
            newRole.setTitle(roleTitle);
            return jobRoleRepository.save(newRole);
        });

        Interview interview = new Interview();
        interview.setUser(user);
        interview.setJobRole(jobRole);
        interview.setInterviewType(request.getInterviewType());
        interview.setDifficulty(request.getDifficulty());
        int requestedQuestions = request.getTotalQuestions() == null ? 5 : request.getTotalQuestions();
        int totalQuestions = Math.max(1, Math.min(requestedQuestions, 15));
        interview.setTotalQuestions(totalQuestions);
        interview.setMode(request.getMode());
        interview.setStatus("ACTIVE");
        interview = interviewRepository.save(interview);

        List<String> questionBank = questionBank(roleTitle, request.getInterviewType());

        for (int index = 0; index < totalQuestions; index++) {
            Question question = new Question();
            question.setInterview(interview);
            question.setPrompt(questionBank.get(index % questionBank.size()));
            question.setType(request.getInterviewType());
            question.setQuestionOrder(index + 1);
            question.setFollowUp(false);
            questionRepository.save(question);
        }

        return interview;
    }

    @Transactional(readOnly = true)
    public Interview getInterview(String email, Long id) {
        return findOwnedInterview(email, id);
    }

    @Transactional(readOnly = true)
    public InterviewResponse getInterviewResponse(String email, Long id) {
        Interview interview = findOwnedInterview(email, id);
        List<InterviewQuestionResponse> questions = questionRepository.findByInterviewOrderByQuestionOrderAsc(interview).stream()
                .map(question -> InterviewQuestionResponse.from(question, answerRepository.existsByQuestion(question)))
                .toList();
        return InterviewResponse.from(interview, questions);
    }

    @Transactional(readOnly = true)
    public List<Question> getQuestions(String email, Long id) {
        Interview interview = findOwnedInterview(email, id);
        return questionRepository.findByInterviewOrderByQuestionOrderAsc(interview);
    }

    @Transactional
    public Answer submitAnswer(String email, Long interviewId, InterviewAnswerRequest request) {
        Interview interview = findOwnedInterview(email, interviewId);
        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + request.getQuestionId()));
        if (!question.getInterview().getId().equals(interview.getId())) {
            throw new AccessDeniedException("Question does not belong to this interview");
        }
        if (interview.getStatus().equals("COMPLETED") || answerRepository.existsByQuestion(question)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This question has already been answered");
        }

        Answer answer = new Answer();
        answer.setInterview(interview);
        answer.setQuestion(question);
        answer.setText(request.getAnswer());
        Map<String, Object> evaluation = aiService.evaluateAnswer(request.getAnswer());
        answer.setScore(((Number) evaluation.get("score")).intValue());
        answer.setTechnicalScore(((Number) evaluation.get("technicalScore")).intValue());
        answer.setCommunicationScore(((Number) evaluation.get("communicationScore")).intValue());
        answer.setRelevanceScore(((Number) evaluation.get("relevance")).intValue());
        answer.setProblemSolvingScore(((Number) evaluation.get("problemSolvingScore")).intValue());
        answer.setDeliveryScore(((Number) evaluation.get("deliveryScore")).intValue());
        answer.setFeedback((String) evaluation.get("feedback"));
        answerRepository.save(answer);

        List<Answer> answers = answerRepository.findByInterview(interview);
        interview.setOverallScore(average(answers, Answer::getScore));
        interview.setCommunicationScore(average(answers, Answer::getCommunicationScore));
        interview.setTechnicalScore(average(answers, Answer::getTechnicalScore));
        interview.setRelevanceScore(average(answers, Answer::getRelevanceScore));
        interview.setProblemSolvingScore(average(answers, Answer::getProblemSolvingScore));
        interview.setDeliveryScore(average(answers, Answer::getDeliveryScore));
        if (answers.size() >= interview.getTotalQuestions()) {
            interview.setStatus("COMPLETED");
            interview.setCompletedAt(java.time.LocalDateTime.now());
        }
        interviewRepository.save(interview);
        return answer;
    }

    @Transactional(readOnly = true)
    public List<Interview> getInterviewsByUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return interviewRepository.findByUser(user);
    }

    @Transactional(readOnly = true)
    public List<InterviewResponse> getInterviewResponsesByUser(String email) {
        return getInterviewsByUser(email).stream()
                .map(interview -> InterviewResponse.from(interview, List.of()))
                .toList();
    }

    private Interview findOwnedInterview(String email, Long id) {
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found: " + id));
        if (!interview.getUser().getEmail().equals(email)) {
            throw new AccessDeniedException("Interview does not belong to the current user");
        }
        return interview;
    }

    private List<String> questionBank(String jobRole, String interviewType) {
        String role = jobRole == null ? "" : jobRole.toLowerCase();
        String type = interviewType == null ? "" : interviewType.toLowerCase();
        if (type.contains("behavior") || type.equals("hr")) {
            return List.of(
                    "Tell me about a challenging project and how you handled the main obstacle.",
                    "Describe a time you received critical feedback. What changed afterward?",
                    "How do you prioritize when several deadlines compete?",
                    "Tell me about a disagreement with a teammate and how you resolved it.",
                    "What kind of work environment helps you do your best work?",
                    "Describe a mistake you made and what you learned from it.",
                    "How do you explain a technical trade-off to a non-technical stakeholder?",
                    "What accomplishment best demonstrates your impact on a team?",
                    "How do you approach learning an unfamiliar technology?",
                    "What would you focus on during your first month in this role?",
                    "Tell me about a time you took ownership beyond your assigned task.",
                    "How do you respond when priorities change unexpectedly?",
                    "Describe how you keep a team informed when work is blocked.",
                    "What professional skill are you currently improving?",
                    "Why are you interested in this role?"
            );
        }
        if (role.contains("full stack")) {
            return List.of(
                    "How would you design a contract between a React client and a Spring Boot API?",
                    "How should authentication state be handled across a browser client and REST backend?",
                    "Walk through a user action from the React component to the database and back.",
                    "How would you validate input consistently across frontend and backend layers?",
                    "How do you prevent stale API responses from overwriting newer UI state?",
                    "Describe an end-to-end test for a form that creates a database record.",
                    "How would you diagnose a slow page that depends on several API requests?",
                    "What belongs in a shared UI component versus a feature-specific component?",
                    "How would you handle pagination for a large table across the API and UI?",
                    "How do database transactions affect a multi-step user workflow?",
                    "How would you protect a REST endpoint and handle expired tokens in the UI?",
                    "Describe a strategy for handling validation errors in a reusable form.",
                    "How would you deploy a frontend and backend with environment-specific configuration?",
                    "What should happen in the UI when a save succeeds but a later refresh fails?",
                    "How do you balance client-side caching with fresh server data?"
            );
        }
        if (role.contains("data")) {
            return List.of(
                    "How would you validate data quality before analyzing a new dataset?",
                    "How do you decide whether to impute or remove missing values?",
                    "Explain how you would investigate an unexpected change in a KPI.",
                    "How would you choose a visualization for comparing several categories over time?",
                    "Describe a SQL query that uses grouping and a window function.",
                    "How do you distinguish correlation from causation in a product analysis?",
                    "What checks would you run before sharing an analysis with stakeholders?",
                    "How would you detect and handle outliers in a skewed distribution?",
                    "How do you measure whether an experiment produced a meaningful result?",
                    "What makes a dashboard actionable rather than merely descriptive?",
                    "How would you explain uncertainty in an estimate to a non-technical audience?",
                    "How do you prevent data leakage when building a predictive model?",
                    "How would you reconcile conflicting definitions of the same business metric?",
                    "Describe how you would automate a recurring data quality check.",
                    "How do you protect sensitive information in an analytics workflow?"
            );
        }
        if (role.contains("java") || role.contains("backend")) {
            return List.of(
                    "Explain polymorphism in Java and give an example from a project.",
                    "How do HashMap and ConcurrentHashMap differ, and when would you use each?",
                    "Describe how Spring dependency injection works.",
                    "How would you design validation and error handling for a REST API?",
                    "Explain transaction boundaries and propagation in Spring.",
                    "How would you investigate a slow SQL query in production?",
                    "What happens during garbage collection in the JVM?",
                    "How would you prevent duplicate requests from creating duplicate records?",
                    "Describe how you would secure an API using JWT.",
                    "When would you choose asynchronous processing in a backend service?",
                    "How do database indexes improve reads, and what do they cost?",
                    "Explain the difference between optimistic and pessimistic locking.",
                    "How would you make a service resilient to a downstream timeout?",
                    "What should be included in a useful unit test for a service method?",
                    "How would you split a monolith into services without a risky rewrite?"
            );
        }
        if (role.contains("react") || role.contains("frontend")) {
            return List.of(
                    "How would you optimize a React view that renders a large list?",
                    "How do you decide where state should live in a React application?",
                    "Explain how effect dependencies affect component behavior.",
                    "How would you make a form accessible and resilient to validation errors?",
                    "What causes unnecessary React renders, and how do you investigate them?",
                    "How would you handle loading, empty, and error states for an API view?",
                    "When would you choose client-side routing over full page navigation?",
                    "How do you keep frontend authentication tokens and requests coordinated?",
                    "How would you test an interactive component with asynchronous data?",
                    "Describe a practical strategy for splitting a large frontend bundle.",
                    "How do semantic HTML elements improve accessibility?",
                    "How would you build a responsive data table for a narrow screen?",
                    "How do you prevent stale network responses from replacing newer results?",
                    "What information should a frontend error boundary capture?",
                    "How would you keep UI state consistent after a successful mutation?"
            );
        }
        return List.of(
                "Walk through a recent project and explain the design decisions you made.",
                "How would you design a reliable API for a high-traffic application?",
                "Describe how you would model data for a feature with evolving requirements.",
                "How do you investigate a production issue when logs are incomplete?",
                "What trade-offs do you consider when choosing a cache strategy?",
                "How would you protect sensitive data in an application?",
                "Describe a testing strategy for a feature spanning UI, API, and database.",
                "How would you improve a slow endpoint from measurement through rollout?",
                "When would you use a message queue instead of a synchronous request?",
                "How do you make a deployment reversible?",
                "Explain a technical decision where you chose simplicity over flexibility.",
                "How would you handle concurrent updates to the same resource?",
                "What metrics would you monitor for a newly launched service?",
                "How do you break down an ambiguous feature request into deliverable work?",
                "Describe how you would make an application usable on mobile devices."
        );
    }

    private int average(List<Answer> answers, java.util.function.Function<Answer, Integer> score) {
        return (int) Math.round(answers.stream()
                .map(score)
                .filter(java.util.Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0));
    }
}
