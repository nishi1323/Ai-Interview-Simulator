package com.aiinterview.repository;

import com.aiinterview.entity.Interview;
import com.aiinterview.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByInterviewOrderByQuestionOrderAsc(Interview interview);
}
