package com.aiinterview.service;

import com.aiinterview.dto.AssistantChatResponse;
import com.aiinterview.dto.AssistantChatTurn;
import com.aiinterview.entity.Interview;
import com.aiinterview.entity.JobRole;
import com.aiinterview.entity.Resume;
import com.aiinterview.entity.User;
import com.aiinterview.repository.InterviewRepository;
import com.aiinterview.repository.ResumeRepository;
import com.aiinterview.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

class AssistantServiceTest {

    @Test
    void usesCandidateResumeAndLatestCompletedInterviewToPersonalizeGuidance() {
        UserRepository userRepository = mock(UserRepository.class);
        ResumeRepository resumeRepository = mock(ResumeRepository.class);
        InterviewRepository interviewRepository = mock(InterviewRepository.class);
        OpenAiAssistantClient openAiAssistantClient = mock(OpenAiAssistantClient.class);
        User user = new User();
        user.setName("Taylor Candidate");
        user.setEmail("taylor@example.test");
        user.setExperienceLevel("Intermediate");
        Resume resume = new Resume();
        resume.setExtractedText("Skills: Java, Spring Boot, SQL");
        JobRole jobRole = new JobRole();
        jobRole.setTitle("Java Developer");
        Interview interview = new Interview();
        interview.setStatus("COMPLETED");
        interview.setOverallScore(76);
        interview.setTechnicalScore(60);
        interview.setCommunicationScore(80);
        interview.setRelevanceScore(75);
        interview.setProblemSolvingScore(82);
        interview.setDeliveryScore(78);
        interview.setJobRole(jobRole);

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(resumeRepository.findFirstByUserOrderByCreatedAtDesc(user)).thenReturn(Optional.of(resume));
        when(interviewRepository.findByUser(user)).thenReturn(List.of(interview));
        when(openAiAssistantClient.isEnabled()).thenReturn(false);

        AssistantService service = new AssistantService(
                userRepository, resumeRepository, interviewRepository, new AiService(), openAiAssistantClient);

        AssistantChatResponse reply = service.respond(
                user.getEmail(), "How can I improve my interview score?", List.of());

        assertThat(reply.reply())
                .contains("Hi Taylor")
                .contains("Java Developer")
                .contains("76%")
                .contains("technical (60/100)");
        assertThat(reply.mode()).isEqualTo("BUILT_IN");
        verify(openAiAssistantClient).isEnabled();
        verifyNoMoreInteractions(openAiAssistantClient);
    }

    @Test
    void forwardsTheSpecificQuestionAndConversationContextToConfiguredAi() {
        UserRepository userRepository = mock(UserRepository.class);
        ResumeRepository resumeRepository = mock(ResumeRepository.class);
        InterviewRepository interviewRepository = mock(InterviewRepository.class);
        OpenAiAssistantClient openAiAssistantClient = mock(OpenAiAssistantClient.class);
        User user = new User();
        user.setName("Taylor Candidate");
        user.setEmail("taylor@example.test");
        List<AssistantChatTurn> history = List.of(new AssistantChatTurn("user", "Explain dependency injection"));
        String question = "Can you show a Spring Boot example?";

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(resumeRepository.findFirstByUserOrderByCreatedAtDesc(user)).thenReturn(Optional.empty());
        when(interviewRepository.findByUser(user)).thenReturn(List.of());
        when(openAiAssistantClient.isEnabled()).thenReturn(true);
        when(openAiAssistantClient.generateReply(eq(question), contains("Software Engineer"), eq(history)))
                .thenReturn("Here is a Spring Boot example tailored to dependency injection.");

        AssistantService service = new AssistantService(
                userRepository, resumeRepository, interviewRepository, new AiService(), openAiAssistantClient);

        AssistantChatResponse reply = service.respond(user.getEmail(), question, history);

        assertThat(reply.reply()).contains("Spring Boot example");
        assertThat(reply.mode()).isEqualTo("AI");
        verify(openAiAssistantClient).generateReply(eq(question), contains("Software Engineer"), eq(history));
    }

    @Test
    void doesNotPretendTheBuiltInFallbackCanAnswerAnUnsupportedQuestion() {
        UserRepository userRepository = mock(UserRepository.class);
        ResumeRepository resumeRepository = mock(ResumeRepository.class);
        InterviewRepository interviewRepository = mock(InterviewRepository.class);
        OpenAiAssistantClient openAiAssistantClient = mock(OpenAiAssistantClient.class);
        User user = new User();
        user.setName("Taylor Candidate");
        user.setEmail("taylor@example.test");
        String question = "Explain dependency injection in Spring";

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(resumeRepository.findFirstByUserOrderByCreatedAtDesc(user)).thenReturn(Optional.empty());
        when(interviewRepository.findByUser(user)).thenReturn(List.of());
        when(openAiAssistantClient.isEnabled()).thenReturn(false);

        AssistantService service = new AssistantService(
                userRepository, resumeRepository, interviewRepository, new AiService(), openAiAssistantClient);

        AssistantChatResponse reply = service.respond(user.getEmail(), question, List.of());

        assertThat(reply.mode()).isEqualTo("BUILT_IN");
        assertThat(reply.reply())
                .contains(question)
                .contains("AI provider is not configured")
                .doesNotContain("What would you like to work on?");
    }
}
