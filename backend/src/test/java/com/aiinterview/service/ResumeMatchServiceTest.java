package com.aiinterview.service;

import com.aiinterview.document.ResumeAnalysisDocument;
import com.aiinterview.dto.JobRoleMatchResponse;
import com.aiinterview.entity.Resume;
import com.aiinterview.entity.User;
import com.aiinterview.repository.ResumeAnalysisRepository;
import com.aiinterview.repository.ResumeRepository;
import com.aiinterview.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ResumeMatchServiceTest {
    @Test
    void matchesJobDescriptionAgainstLatestOwnedMongoAnalysis() {
        String email = "candidate@example.test";
        User user = new User();
        user.setId(3L);
        user.setEmail(email);

        Resume resume = new Resume();
        resume.setId(11L);
        resume.setUser(user);
        resume.setFilename("candidate.pdf");
        resume.setAnalysisDocumentId("analysis-uuid");

        ResumeAnalysisDocument document = new ResumeAnalysisDocument();
        document.setAnalysis(Map.of("skills", List.of("Java", "SQL")));

        ResumeRepository resumeRepository = mock(ResumeRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        ResumeAnalysisRepository analysisRepository = mock(ResumeAnalysisRepository.class);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(resumeRepository.findFirstByUserOrderByCreatedAtDesc(user)).thenReturn(Optional.of(resume));
        when(resumeRepository.findById(resume.getId())).thenReturn(Optional.of(resume));
        when(analysisRepository.findById(resume.getAnalysisDocumentId())).thenReturn(Optional.of(document));

        ResumeService service = new ResumeService(
                resumeRepository,
                userRepository,
                analysisRepository,
                new AiService(),
                new PdfTextExtractor()
        );

        JobRoleMatchResponse result = service.matchJobDescription(
                email,
                "Backend Developer",
                "Need Java, Spring Boot and SQL experience."
        );

        assertThat(result.matchPercent()).isEqualTo(67);
        assertThat(result.resumeFilename()).isEqualTo("candidate.pdf");
        assertThat(result.missingSkills()).containsExactly("Spring Boot");
    }
}