package com.aiinterview.document;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@Document(collection = "resume_analyses")
public class ResumeAnalysisDocument {
    @Id
    private String id;
    private Long resumeId;
    private Long userId;
    private String filename;
    private Map<String, Object> analysis;
    private LocalDateTime analyzedAt = LocalDateTime.now();
}