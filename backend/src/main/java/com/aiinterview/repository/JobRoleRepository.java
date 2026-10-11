package com.aiinterview.repository;

import com.aiinterview.entity.JobRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JobRoleRepository extends JpaRepository<JobRole, Long> {
    Optional<JobRole> findByTitle(String title);
}
