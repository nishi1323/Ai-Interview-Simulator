package com.aiinterview.controller;

import com.aiinterview.dto.JobRoleMatchRequest;
import com.aiinterview.dto.JobRoleMatchResponse;
import com.aiinterview.service.ResumeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/job-roles")
@RequiredArgsConstructor
public class JobRoleController {
    private final ResumeService resumeService;

    @PostMapping("/match")
    public ResponseEntity<JobRoleMatchResponse> matchResume(@Valid @RequestBody JobRoleMatchRequest request,
                                                           Authentication authentication) {
        return ResponseEntity.ok(resumeService.matchJobDescription(
                authentication.getName(),
                request.getJobRole(),
                request.getJobDescription()
        ));
    }
}