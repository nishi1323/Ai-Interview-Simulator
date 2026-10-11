package com.aiinterview.repository;

import com.aiinterview.entity.Resume;
import com.aiinterview.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
	Optional<Resume> findFirstByUserOrderByCreatedAtDesc(User user);
}
