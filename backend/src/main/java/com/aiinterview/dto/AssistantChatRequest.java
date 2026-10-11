package com.aiinterview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AssistantChatRequest(
        @NotBlank @Size(max = 1000) String message,
        @Valid @Size(max = 10) List<AssistantChatTurn> history
) {
}
