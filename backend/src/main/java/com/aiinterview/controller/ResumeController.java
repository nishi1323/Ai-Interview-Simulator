package com.aiinterview.controller;

import com.aiinterview.dto.ResumeResponse;
import com.aiinterview.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping("/resume/upload")
    public ResponseEntity<ResumeResponse> uploadResume(@RequestParam("file") MultipartFile file, Authentication authentication) {
        String email = authentication.getName();
        var resume = resumeService.uploadResume(email, file);
        return ResponseEntity.ok(resumeService.getResume(email, resume.getId()));
    }

    @GetMapping("/resume/{id}")
    public ResponseEntity<ResumeResponse> getResume(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(resumeService.getResume(authentication.getName(), id));
    }
}
