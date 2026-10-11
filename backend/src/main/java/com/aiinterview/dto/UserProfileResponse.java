package com.aiinterview.dto;

import com.aiinterview.entity.User;
import java.time.LocalDateTime;

public record UserProfileResponse(Long id, String name, String email, String phone, String experienceLevel, LocalDateTime createdAt) {
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getExperienceLevel(), user.getCreatedAt());
    }
}