package com.aiinterview.service;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GroqAssistantClientTest {

    @Test
    void resolvesChatCompletionsUriCorrectlyRegardlessOfFormat() {
        assertThat(GroqAssistantClient.resolveChatCompletionsUri(null))
                .isEqualTo("https://api.groq.com/openai/v1/chat/completions");
        assertThat(GroqAssistantClient.resolveChatCompletionsUri(""))
                .isEqualTo("https://api.groq.com/openai/v1/chat/completions");
        assertThat(GroqAssistantClient.resolveChatCompletionsUri("   "))
                .isEqualTo("https://api.groq.com/openai/v1/chat/completions");
        assertThat(GroqAssistantClient.resolveChatCompletionsUri("https://api.groq.com/openai/v1"))
                .isEqualTo("https://api.groq.com/openai/v1/chat/completions");
        assertThat(GroqAssistantClient.resolveChatCompletionsUri("https://api.groq.com/openai/v1/"))
                .isEqualTo("https://api.groq.com/openai/v1/chat/completions");
        assertThat(GroqAssistantClient.resolveChatCompletionsUri("https://api.groq.com/openai/v1/chat/completions"))
                .isEqualTo("https://api.groq.com/openai/v1/chat/completions");
        assertThat(GroqAssistantClient.resolveChatCompletionsUri("https://custom-proxy.example.com/v1"))
                .isEqualTo("https://custom-proxy.example.com/v1/chat/completions");
    }

    @Test
    void resolvesModelsUriCorrectlyRegardlessOfFormat() {
        assertThat(GroqAssistantClient.resolveModelsUri(null))
                .isEqualTo("https://api.groq.com/openai/v1/models");
        assertThat(GroqAssistantClient.resolveModelsUri(""))
                .isEqualTo("https://api.groq.com/openai/v1/models");
        assertThat(GroqAssistantClient.resolveModelsUri("   "))
                .isEqualTo("https://api.groq.com/openai/v1/models");
        assertThat(GroqAssistantClient.resolveModelsUri("https://api.groq.com/openai/v1"))
                .isEqualTo("https://api.groq.com/openai/v1/models");
        assertThat(GroqAssistantClient.resolveModelsUri("https://api.groq.com/openai/v1/"))
                .isEqualTo("https://api.groq.com/openai/v1/models");
        assertThat(GroqAssistantClient.resolveModelsUri("https://api.groq.com/openai/v1/chat/completions"))
                .isEqualTo("https://api.groq.com/openai/v1/models");
        assertThat(GroqAssistantClient.resolveModelsUri("https://custom-proxy.example.com/v1"))
                .isEqualTo("https://custom-proxy.example.com/v1/models");
    }

    @Test
    void disabledWhenApiKeyMissingOrBlank() {
        GroqAssistantClient client1 = new GroqAssistantClient("", "llama-3.3-70b-versatile");
        assertThat(client1.isEnabled()).isFalse();

        GroqAssistantClient client2 = new GroqAssistantClient("   ", "llama-3.3-70b-versatile");
        assertThat(client2.isEnabled()).isFalse();

        Map<String, Object> status = client1.checkStatus();
        assertThat(status.get("status")).isEqualTo("MISSING_API_KEY");
        assertThat(status.get("configured")).isEqualTo(false);
    }

    @Test
    void sanitizesQuotedApiKey() {
        GroqAssistantClient client = new GroqAssistantClient("  \"gsk_test_12345\"  ", "llama-3.3-70b-versatile");
        assertThat(client.isEnabled()).isTrue();
        assertThat(client.getChatCompletionsUri()).isEqualTo("https://api.groq.com/openai/v1/chat/completions");
        assertThat(client.getModelsUri()).isEqualTo("https://api.groq.com/openai/v1/models");
        assertThat(client.getModel()).isEqualTo("llama-3.3-70b-versatile");
        assertThat(client.getConfiguredModel()).isEqualTo("llama-3.3-70b-versatile");
    }

    @Test
    void supportsActiveModelCustomizationAndFallback() {
        GroqAssistantClient client = new GroqAssistantClient("gsk_test", "llama-3.3-70b-versatile");
        assertThat(client.getActiveModel()).isEqualTo("llama-3.3-70b-versatile");

        client.setActiveModel("llama-3.1-8b-instant");
        assertThat(client.getActiveModel()).isEqualTo("llama-3.1-8b-instant");
        assertThat(client.getModel()).isEqualTo("llama-3.1-8b-instant");
        assertThat(client.getConfiguredModel()).isEqualTo("llama-3.3-70b-versatile");
    }
}
