package com.aiinterview.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record ResumeResponse(Long id, String filename, LocalDateTime createdAt, Map<String, Object> analysis) {
}