package com.aiinterview.repository;

import com.aiinterview.entity.Interview;
import com.aiinterview.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByUser(User user);
}
