package com.aiinterview.controller;

import com.aiinterview.dto.InterviewAnswerRequest;
import com.aiinterview.dto.InterviewCreateRequest;
import com.aiinterview.dto.AnswerResponse;
import com.aiinterview.dto.InterviewResponse;
import com.aiinterview.dto.InterviewQuestionResponse;
import com.aiinterview.service.InterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/interviews")
    public ResponseEntity<InterviewResponse> createInterview(@Valid @RequestBody InterviewCreateRequest request,
                                                             Authentication authentication) {
        var interview = interviewService.createInterview(authentication.getName(), request);
        return ResponseEntity.ok(interviewService.getInterviewResponse(authentication.getName(), interview.getId()));
    }

    @GetMapping("/interviews")
    public ResponseEntity<List<InterviewResponse>> getInterviews(Authentication authentication) {
        return ResponseEntity.ok(interviewService.getInterviewResponsesByUser(authentication.getName()));
    }

    @GetMapping("/interviews/{id}")
    public ResponseEntity<InterviewResponse> getInterview(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(interviewService.getInterviewResponse(authentication.getName(), id));
    }

    @PostMapping("/interviews/{id}/answer")
    public ResponseEntity<AnswerResponse> submitAnswer(@PathVariable Long id,
                                                       @Valid @RequestBody InterviewAnswerRequest request,
                                                       Authentication authentication) {
        return ResponseEntity.ok(AnswerResponse.from(interviewService.submitAnswer(authentication.getName(), id, request)));
    }

    @GetMapping("/interviews/{id}/questions")
    public ResponseEntity<List<InterviewQuestionResponse>> getInterviewQuestions(@PathVariable Long id, Authentication authentication) {
        List<InterviewQuestionResponse> questions = interviewService.getInterviewResponse(authentication.getName(), id).questions();
        return ResponseEntity.ok(questions);
    }
}
