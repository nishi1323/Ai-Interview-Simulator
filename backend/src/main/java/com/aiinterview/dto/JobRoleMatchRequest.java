package com.aiinterview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class JobRoleMatchRequest {
    @NotBlank
    private String jobRole;

    @NotBlank
    @Size(max = 12000)
    private String jobDescription;
}