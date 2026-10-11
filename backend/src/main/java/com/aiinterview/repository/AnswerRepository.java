package com.aiinterview.repository;

import com.aiinterview.entity.Answer;
import com.aiinterview.entity.Interview;
import com.aiinterview.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findByInterview(Interview interview);
    boolean existsByQuestion(Question question);
}
