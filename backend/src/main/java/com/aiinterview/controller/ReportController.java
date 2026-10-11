package com.aiinterview.controller;

import com.aiinterview.dto.InterviewResponse;
import com.aiinterview.entity.Interview;
import com.aiinterview.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.IntStream;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReportController {
    private final InterviewService interviewService;

    @GetMapping("/reports/{interviewId}")
    public ResponseEntity<InterviewResponse> getReport(@PathVariable Long interviewId, Authentication authentication) {
        return ResponseEntity.ok(interviewService.getInterviewResponse(authentication.getName(), interviewId));
    }

    @GetMapping("/skill-gaps")
    public ResponseEntity<List<Map<String, Object>>> skillGaps(Authentication authentication) {
        Optional<Interview> latest = latestCompletedInterview(authentication.getName());
        if (latest.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        List<Map<String, Object>> gaps = dimensions(latest.get()).stream()
                .filter(dimension -> dimension.score() < 90)
                .sorted(Comparator.comparingInt(ScoreDimension::score))
                .map(dimension -> Map.<String, Object>of(
                        "skill", dimension.name(),
                        "score", dimension.score(),
                        "gapPercent", 100 - dimension.score()))
                .toList();
        return ResponseEntity.ok(gaps);
    }

    @GetMapping("/roadmap")
    public ResponseEntity<List<Map<String, Object>>> roadMap(Authentication authentication) {
        Optional<Interview> latest = latestCompletedInterview(authentication.getName());
        if (latest.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<ScoreDimension> weakestDimensions = dimensions(latest.get()).stream()
                .sorted(Comparator.comparingInt(ScoreDimension::score))
                .limit(5)
            .toList();
        List<Map<String, Object>> plan = IntStream.range(0, weakestDimensions.size())
            .mapToObj(index -> roadmapItem(index + 1, weakestDimensions.get(index), latest.get()))
                .toList();
        return ResponseEntity.ok(plan);
    }

    private Optional<Interview> latestCompletedInterview(String email) {
        return interviewService.getInterviewsByUser(email).stream()
                .filter(interview -> "COMPLETED".equals(interview.getStatus()))
                .max(Comparator.comparing(Interview::getCompletedAt, Comparator.nullsFirst(Comparator.naturalOrder())));
    }

    private List<ScoreDimension> dimensions(Interview interview) {
        return List.of(
                new ScoreDimension("Technical knowledge", interview.getTechnicalScore(), "Review " + roleName(interview) + " concepts", "Revisit the concepts behind your lowest-scoring " + roleName(interview) + " answers and solve two focused exercises.", "first-unique-character"),
                new ScoreDimension("Communication", interview.getCommunicationScore(), "Structure concise answers", "Practice a two-minute " + roleName(interview) + " answer with a clear opening, example, and conclusion.", null),
                new ScoreDimension("Relevance", interview.getRelevanceScore(), "Connect answers to " + roleName(interview), "For each " + roleName(interview) + " prompt, identify the requirement it tests and tie your example directly to it.", null),
                new ScoreDimension("Problem solving", interview.getProblemSolvingScore(), "Practice problem decomposition", "State assumptions, compare options, and cover an edge case. Then solve a focused coding challenge.", "longest-unique-substring"),
                new ScoreDimension("Delivery", interview.getDeliveryScore(), "Practice answer delivery", "Record a short " + roleName(interview) + " response and review pace, pauses, and filler words.", null))
                .stream()
                .filter(dimension -> dimension.score() != null)
                .toList();
    }

    private Map<String, Object> roadmapItem(int day, ScoreDimension dimension, Interview interview) {
        Map<String, Object> item = new java.util.HashMap<>();
        item.put("day", day);
        item.put("topic", dimension.topic());
        item.put("task", dimension.task());
        item.put("focus", dimension.name());
        item.put("baselineScore", dimension.score());
        item.put("targetRole", roleName(interview));
        item.put("interviewId", interview.getId());
        if (dimension.challengeId() != null) {
            item.put("challengeId", dimension.challengeId());
        }
        return item;
    }

    private String roleName(Interview interview) {
        return interview.getJobRole() == null ? "your target role" : interview.getJobRole().getTitle();
    }

    private record ScoreDimension(String name, Integer score, String topic, String task, String challengeId) { }
}
