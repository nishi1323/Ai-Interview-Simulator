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

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ResumeService.class);

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

        Map<String, Object> analysis = aiService.analyzeResume(resume);
        if (analysis.get("skills") instanceof List<?> skillsList) {
            resume.setSkills(skillsList.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(", ")));
        }
        if (analysis.get("education") instanceof String edu) {
            resume.setEducation(edu.length() > 2000 ? edu.substring(0, 2000) : edu);
        }
        if (analysis.get("experience") instanceof String exp) {
            resume.setExperience(exp.length() > 2000 ? exp.substring(0, 2000) : exp);
        }
        if (analysis.get("projects") instanceof List<?> projList) {
            String projects = projList.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining("; "));
            resume.setProjects(projects.length() > 2000 ? projects.substring(0, 2000) : projects);
        }
        if (analysis.get("certifications") instanceof List<?> certList) {
            String certs = certList.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining("; "));
            resume.setCertifications(certs.length() > 2000 ? certs.substring(0, 2000) : certs);
        }

        Resume savedResume = resumeRepository.save(resume);
        ResumeAnalysisDocument document = new ResumeAnalysisDocument();
        document.setId(savedResume.getAnalysisDocumentId());
        document.setResumeId(savedResume.getId());
        document.setUserId(user.getId());
        document.setFilename(savedResume.getFilename());
        document.setAnalysis(analysis);

        try {
            resumeAnalysisRepository.save(document);
        } catch (DataAccessException | com.mongodb.MongoException exception) {
            log.warn("MongoDB resume analysis storage failed for resume {}: {}. Relational resume data is preserved.",
                    savedResume.getId(), exception.getMessage());
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
        Map<String, Object> analysis = null;
        try {
            ResumeAnalysisDocument document = resumeAnalysisRepository.findById(resume.getAnalysisDocumentId())
                    .orElse(null);
            if (document != null && document.getAnalysis() != null) {
                analysis = document.getAnalysis();
            }
        } catch (DataAccessException | com.mongodb.MongoException exception) {
            log.warn("MongoDB unavailable when retrieving resume analysis {}: {}",
                    resume.getAnalysisDocumentId(), exception.getMessage());
        }
        if (analysis == null) {
            analysis = aiService.analyzeResume(resume);
        }
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
