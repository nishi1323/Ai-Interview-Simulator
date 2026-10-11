package com.aiinterview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserProfileUpdateRequest {
    @NotBlank
    @Size(min = 2, max = 80)
    private String name;

    @Size(max = 30)
    private String phone;

    @Size(max = 40)
    private String experienceLevel;
}