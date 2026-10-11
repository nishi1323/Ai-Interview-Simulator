package com.aiinterview.service;

import com.aiinterview.dto.InterviewCreateRequest;
import com.aiinterview.entity.Interview;
import com.aiinterview.entity.JobRole;
import com.aiinterview.entity.Question;
import com.aiinterview.entity.User;
import com.aiinterview.repository.AnswerRepository;
import com.aiinterview.repository.InterviewRepository;
import com.aiinterview.repository.JobRoleRepository;
import com.aiinterview.repository.QuestionRepository;
import com.aiinterview.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InterviewServiceTest {
    @Test
    void persistsSelectedRoleAndGeneratesMatchingQuestionBank() {
        InterviewRepository interviewRepository = mock(InterviewRepository.class);
        JobRoleRepository jobRoleRepository = mock(JobRoleRepository.class);
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        AnswerRepository answerRepository = mock(AnswerRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        AiService aiService = new AiService();
        User user = new User();
        user.setEmail("candidate@example.test");
        JobRole jobRole = new JobRole();
        jobRole.setTitle("Full Stack Developer");

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(jobRoleRepository.findByTitle(jobRole.getTitle())).thenReturn(Optional.of(jobRole));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InterviewService service = new InterviewService(
                interviewRepository,
                jobRoleRepository,
                questionRepository,
                answerRepository,
                userRepository,
                aiService
        );
        InterviewCreateRequest request = new InterviewCreateRequest();
        request.setJobRole(jobRole.getTitle());
        request.setInterviewType("Technical");
        request.setDifficulty("Intermediate");
        request.setTotalQuestions(5);
        request.setMode("Text");

        Interview interview = service.createInterview(user.getEmail(), request);

        ArgumentCaptor<Question> questions = ArgumentCaptor.forClass(Question.class);
        verify(questionRepository, times(5)).save(questions.capture());
        assertThat(interview.getJobRole()).isSameAs(jobRole);
        assertThat(questions.getAllValues().get(0).getPrompt())
                .contains("React client and a Spring Boot API");
    }
}