package com.aiinterview.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "interview_feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterviewFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;

    @Column(length = 3000)
    private String strengths;

    @Column(length = 3000)
    private String weaknesses;

    @Column(length = 5000)
    private String summary;
}
