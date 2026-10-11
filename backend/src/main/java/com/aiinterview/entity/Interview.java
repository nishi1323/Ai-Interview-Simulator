package com.aiinterview.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Interview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_role_id")
    private JobRole jobRole;

    private String interviewType;
    private String difficulty;
    private Integer totalQuestions;
    private String mode;
    private Integer overallScore;
    private Integer technicalScore;
    private Integer communicationScore;
    private Integer relevanceScore;
    private Integer problemSolvingScore;
    private Integer deliveryScore;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime completedAt;
    private String status;
}
