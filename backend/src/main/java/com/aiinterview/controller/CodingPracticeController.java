package com.aiinterview.controller;

import com.aiinterview.dto.CodingChallengeResponse;
import com.aiinterview.entity.Interview;
import com.aiinterview.service.CodingPracticeService;
import com.aiinterview.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/coding-practice")
@RequiredArgsConstructor
public class CodingPracticeController {
    private final InterviewService interviewService;
    private final CodingPracticeService codingPracticeService;

    @GetMapping("/challenges")
    public ResponseEntity<List<CodingChallengeResponse>> challenges(Authentication authentication) {
        Optional<Interview> latestCompleted = interviewService.getInterviewsByUser(authentication.getName()).stream()
                .filter(interview -> "COMPLETED".equals(interview.getStatus()))
                .max(Comparator.comparing(Interview::getCompletedAt, Comparator.nullsFirst(Comparator.naturalOrder())));
        return ResponseEntity.ok(codingPracticeService.recommendations(latestCompleted.orElse(null)));
    }
}