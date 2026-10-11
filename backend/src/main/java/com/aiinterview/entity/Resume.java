package com.aiinterview.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "resumes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Resume {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String filename;

    @Column(length = 36, unique = true)
    private String analysisDocumentId;

    @Column(columnDefinition = "TEXT")
    private String extractedText;

    @Column(length = 2000)
    private String education;

    @Column(length = 2000)
    private String skills;

    @Column(length = 2000)
    private String projects;

    @Column(length = 2000)
    private String certifications;

    @Column(length = 2000)
    private String experience;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
