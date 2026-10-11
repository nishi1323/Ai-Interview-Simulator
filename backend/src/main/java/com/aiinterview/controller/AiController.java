package com.aiinterview.controller;

import com.aiinterview.entity.Resume;
import com.aiinterview.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/analyze-resume")
    public ResponseEntity<Map<String, Object>> analyzeResume(@RequestBody Map<String, String> payload) {
        Resume resume = new Resume();
        resume.setExtractedText(payload.getOrDefault("text", ""));
        return ResponseEntity.ok(aiService.analyzeResume(resume));
    }

    @PostMapping("/generate-question")
    public ResponseEntity<Map<String, Object>> generateQuestion(@RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(aiService.generateQuestion(
                payload.getOrDefault("jobRole", "Software Engineer"),
                payload.getOrDefault("difficulty", "Intermediate"),
                payload.getOrDefault("resumeText", "")
        ));
    }

    @PostMapping("/evaluate-answer")
    public ResponseEntity<Map<String, Object>> evaluateAnswer(@RequestBody Map<String, String> payload) {
        String answer = payload.getOrDefault("answer", "");
        return ResponseEntity.ok(aiService.evaluateAnswer(answer));
    }

    @PostMapping("/analyze-speech")
    public ResponseEntity<Map<String, Object>> analyzeSpeech(@RequestBody Map<String, Object> payload) {
        String transcript = String.valueOf(payload.getOrDefault("transcript", ""));
        Object secondsValue = payload.getOrDefault("durationSeconds", 0);
        Integer durationSeconds = secondsValue instanceof Number ? ((Number) secondsValue).intValue() : 0;
        return ResponseEntity.ok(aiService.analyzeSpeech(transcript, durationSeconds));
    }

}
