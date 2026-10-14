package com.aiinterview.service;

import com.aiinterview.document.ResumeAnalysisDocument;
import com.aiinterview.dto.ResumeResponse;
import com.aiinterview.entity.Resume;
import com.aiinterview.entity.User;
import com.aiinterview.repository.ResumeAnalysisRepository;
import com.aiinterview.repository.ResumeRepository;
import com.aiinterview.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ResumeServiceTest {

    @Test
    void uploadResumeSavesRelationalDataEvenIfMongoFails() throws Exception {
        ResumeRepository resumeRepository = mock(ResumeRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        ResumeAnalysisRepository analysisRepository = mock(ResumeAnalysisRepository.class);
        PdfTextExtractor pdfTextExtractor = mock(PdfTextExtractor.class);
        AiService aiService = new AiService();

        User user = new User();
        user.setId(1L);
        user.setEmail("user@example.com");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(pdfTextExtractor.extractText(any())).thenReturn("Jane Doe\nSkills: Java, React, SQL\nEducation: BTech");
        when(resumeRepository.save(any(Resume.class))).thenAnswer(invocation -> {
            Resume r = invocation.getArgument(0);
            r.setId(42L);
            return r;
        });
        when(analysisRepository.save(any(ResumeAnalysisDocument.class)))
                .thenThrow(new DataAccessResourceFailureException("MongoDB connection refused"));

        ResumeService service = new ResumeService(
                resumeRepository, userRepository, analysisRepository, aiService, pdfTextExtractor);

        MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", new byte[]{1, 2, 3});
        Resume saved = service.uploadResume("user@example.com", file);

        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isEqualTo(42L);
        assertThat(saved.getSkills()).contains("Java", "React", "SQL");
        assertThat(saved.getEducation()).contains("BTech");
        verify(resumeRepository).save(any(Resume.class));
    }

    @Test
    void getResumeFallsBackToRelationalAnalysisIfMongoFails() {
        ResumeRepository resumeRepository = mock(ResumeRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        ResumeAnalysisRepository analysisRepository = mock(ResumeAnalysisRepository.class);
        PdfTextExtractor pdfTextExtractor = mock(PdfTextExtractor.class);
        AiService aiService = new AiService();

        User user = new User();
        user.setId(1L);
        user.setEmail("user@example.com");

        Resume resume = new Resume();
        resume.setId(42L);
        resume.setUser(user);
        resume.setFilename("resume.pdf");
        resume.setAnalysisDocumentId("doc-123");
        resume.setExtractedText("Skills: Java, Spring Boot\nEducation: Computer Science");

        when(resumeRepository.findById(42L)).thenReturn(Optional.of(resume));
        when(analysisRepository.findById("doc-123"))
                .thenThrow(new DataAccessResourceFailureException("MongoDB unavailable"));

        ResumeService service = new ResumeService(
                resumeRepository, userRepository, analysisRepository, aiService, pdfTextExtractor);

        ResumeResponse response = service.getResume("user@example.com", 42L);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(42L);
        assertThat(response.analysis()).isNotNull();
        assertThat(response.analysis().get("skills")).asList().contains("Java", "Spring Boot");
    }
}
