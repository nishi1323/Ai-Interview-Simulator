package com.aiinterview.service;

import com.aiinterview.document.ResumeAnalysisDocument;
import com.aiinterview.dto.JobRoleMatchResponse;
import com.aiinterview.dto.ResumeResponse;
import com.aiinterview.entity.Resume;
import com.aiinterview.entity.User;
import com.aiinterview.exception.ResourceNotFoundException;
import com.aiinterview.repository.ResumeAnalysisRepository;
import com.aiinterview.repository.ResumeRepository;
import com.aiinterview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final AiService aiService;
    private final PdfTextExtractor pdfTextExtractor;

    @Transactional
    public Resume uploadResume(String email, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Resume is required.");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF resumes are supported.");
        }

        if (file.getSize() > 5L * 1024 * 1024) {
            throw new IllegalArgumentException("Resume size must be less than 5MB.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        Resume resume = new Resume();
        resume.setUser(user);
        resume.setFilename(originalName);
        resume.setAnalysisDocumentId(UUID.randomUUID().toString());

        try {
            String text = pdfTextExtractor.extractText(file.getBytes());
            if (text.isBlank()) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "No selectable text was found. Scanned PDFs need OCR before upload.");
            }
            resume.setExtractedText(text);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The uploaded file is not a readable PDF.", e);
        }

        Resume savedResume = resumeRepository.save(resume);
        ResumeAnalysisDocument document = new ResumeAnalysisDocument();
        document.setId(savedResume.getAnalysisDocumentId());
        document.setResumeId(savedResume.getId());
        document.setUserId(user.getId());
        document.setFilename(savedResume.getFilename());
        document.setAnalysis(aiService.analyzeResume(savedResume));

        try {
            resumeAnalysisRepository.save(document);
        } catch (DataAccessException | com.mongodb.MongoException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Resume analysis storage is unavailable.", exception);
        }
        return savedResume;
    }

    @Transactional(readOnly = true)
    public ResumeResponse getResume(String email, Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found: " + resumeId));
        if (!resume.getUser().getEmail().equals(email)) {
            throw new AccessDeniedException("Resume does not belong to the current user");
        }
        ResumeAnalysisDocument document;
        try {
            document = resumeAnalysisRepository.findById(resume.getAnalysisDocumentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resume analysis not found: " + resumeId));
        } catch (DataAccessException | com.mongodb.MongoException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Resume analysis storage is unavailable.", exception);
        }
        Map<String, Object> analysis = document.getAnalysis();
        return new ResumeResponse(resume.getId(), resume.getFilename(), resume.getCreatedAt(), analysis);
    }

    @Transactional(readOnly = true)
    public JobRoleMatchResponse matchJobDescription(String email, String jobRole, String jobDescription) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        Resume resume = resumeRepository.findFirstByUserOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new ResourceNotFoundException("Upload a resume before matching a job description."));
        Map<String, Object> analysis = getResume(email, resume.getId()).analysis();
        List<String> skills = analysis.get("skills") instanceof List<?> values
                ? values.stream().filter(String.class::isInstance).map(String.class::cast).toList()
                : List.of();
        return aiService.matchResumeToJob(jobRole, resume.getFilename(), skills, jobDescription);
    }
}
