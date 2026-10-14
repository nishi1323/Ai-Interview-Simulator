package com.aiinterview.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseConfigTest {

    @Test
    void preservesExistingJdbcPostgresUrl() {
        var result = DatabaseConfig.parseAndNormalizeUrl(
                "jdbc:postgresql://ep-xyz.render.com:5432/mydb", "user1", "pass1");

        assertThat(result.jdbcUrl()).isEqualTo("jdbc:postgresql://ep-xyz.render.com:5432/mydb");
        assertThat(result.username()).isEqualTo("user1");
        assertThat(result.password()).isEqualTo("pass1");
    }

    @Test
    void convertsRenderPostgresUriToJdbcUrlAndExtractsCredentials() {
        var result = DatabaseConfig.parseAndNormalizeUrl(
                "postgres://render_user:secret_pwd@dpg-abc-a.oregon-postgres.render.com:5432/interview_db",
                null,
                null);

        assertThat(result.jdbcUrl()).startsWith("jdbc:postgresql://dpg-abc-a.oregon-postgres.render.com:5432/interview_db");
        assertThat(result.username()).isEqualTo("render_user");
        assertThat(result.password()).isEqualTo("secret_pwd");
    }

    @Test
    void preservesQueryParametersWhenConvertingUri() {
        var result = DatabaseConfig.parseAndNormalizeUrl(
                "postgresql://myuser:mypass@dpg-abc-a:5432/interview_db?sslmode=require",
                null,
                null);

        assertThat(result.jdbcUrl()).isEqualTo("jdbc:postgresql://dpg-abc-a:5432/interview_db?sslmode=require");
        assertThat(result.username()).isEqualTo("myuser");
        assertThat(result.password()).isEqualTo("mypass");
    }

    @Test
    void preservesH2JdbcUrl() {
        var result = DatabaseConfig.parseAndNormalizeUrl(
                "jdbc:h2:mem:ai_interview;DB_CLOSE_DELAY=-1", "sa", "");

        assertThat(result.jdbcUrl()).isEqualTo("jdbc:h2:mem:ai_interview;DB_CLOSE_DELAY=-1");
        assertThat(result.username()).isEqualTo("sa");
        assertThat(result.password()).isEqualTo("");
    }
}
