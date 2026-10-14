package com.aiinterview.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;
import java.util.Arrays;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties, Environment env) {
        boolean isProduction = Arrays.asList(env.getActiveProfiles()).contains("production");
        boolean isDemo = Arrays.asList(env.getActiveProfiles()).contains("demo");

        // 1. Determine raw database connection URL
        String rawUrl = env.getProperty("DB_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = env.getProperty("DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = env.getProperty("INTERNAL_DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = properties.getUrl();
        }

        // 2. Validate for production / demo / local
        if (isDemo) {
            log.info("Running in DEMO mode with in-memory H2 database.");
            return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
        }

        if (rawUrl == null || rawUrl.isBlank()) {
            if (isProduction) {
                throw new IllegalStateException(
                        "Production database URL is required. Please set DB_URL, DATABASE_URL, or INTERNAL_DATABASE_URL in Render environment variables.");
            }
            rawUrl = "jdbc:postgresql://localhost:5432/ai_interview";
        }

        if (isProduction && (rawUrl.contains("localhost") || rawUrl.contains("127.0.0.1"))) {
            throw new IllegalStateException(
                    "Production environment cannot use 'localhost' as PostgreSQL host. Configure a valid Render PostgreSQL database.");
        }

        // 3. Normalize and adapt Render URI formats (postgres:// or postgresql://) to JDBC
        ParsedDbInfo parsed = parseAndNormalizeUrl(rawUrl, properties.getUsername(), properties.getPassword());

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(parsed.jdbcUrl());
        dataSource.setUsername(parsed.username());
        dataSource.setPassword(parsed.password());

        if (parsed.jdbcUrl().startsWith("jdbc:postgresql:")) {
            dataSource.setDriverClassName("org.postgresql.Driver");
        } else if (parsed.jdbcUrl().startsWith("jdbc:h2:")) {
            dataSource.setDriverClassName("org.h2.Driver");
        } else if (properties.getDriverClassName() != null && !properties.getDriverClassName().isBlank()) {
            dataSource.setDriverClassName(properties.getDriverClassName());
        }

        // Pool tuning for Render container environment (512MB RAM free tier)
        if (isProduction) {
            dataSource.setMaximumPoolSize(5);
            dataSource.setMinimumIdle(1);
            dataSource.setIdleTimeout(30000);
            dataSource.setMaxLifetime(600000);
            dataSource.setConnectionTimeout(30000);
            dataSource.setInitializationFailTimeout(60000);
        }

        // DNS pre-resolution diagnostic
        try {
            String stripped = parsed.jdbcUrl().replace("jdbc:postgresql://", "http://").split("\\?")[0];
            URI targetUri = URI.create(stripped);
            String host = targetUri.getHost();
            if (host != null && !host.equals("localhost")) {
                java.net.InetAddress addr = java.net.InetAddress.getByName(host);
                log.info("DNS resolved database host '{}' to [{}]", host, addr.getHostAddress());
            }
        } catch (Exception ex) {
            log.warn("DNS check for database host had a notice: {}. HikariCP will proceed with configured retries.", ex.getMessage());
        }

        log.info("Initialized DataSource for target: {}", maskUrl(parsed.jdbcUrl()));
        return dataSource;
    }

    public static ParsedDbInfo parseAndNormalizeUrl(String url, String configuredUsername, String configuredPassword) {
        if (url == null || url.isBlank()) {
            return new ParsedDbInfo(url, configuredUsername, configuredPassword);
        }

        String trimmed = url.trim();

        // If it's already a JDBC URL, use as-is with configured credentials
        if (trimmed.startsWith("jdbc:")) {
            return new ParsedDbInfo(trimmed, configuredUsername, configuredPassword);
        }

        // If it's a Render / Heroku URI format: postgres:// or postgresql://
        if (trimmed.startsWith("postgres://") || trimmed.startsWith("postgresql://")) {
            try {
                // Use dummy http scheme for java.net.URI parsing
                String uriString = trimmed.replaceFirst("^postgres(ql)?://", "http://");
                URI uri = new URI(uriString);

                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath(); // e.g. /ai_interview
                String dbName = (path != null && path.length() > 1) ? path.substring(1) : "";

                String resolvedUser = configuredUsername;
                String resolvedPassword = configuredPassword;

                if (uri.getUserInfo() != null) {
                    String[] parts = uri.getUserInfo().split(":", 2);
                    if (resolvedUser == null || resolvedUser.isBlank() || "postgres".equalsIgnoreCase(resolvedUser)) {
                        resolvedUser = parts[0];
                    }
                    if ((resolvedPassword == null || resolvedPassword.isBlank()) && parts.length > 1) {
                        resolvedPassword = parts[1];
                    }
                }

                StringBuilder jdbcBuilder = new StringBuilder("jdbc:postgresql://")
                        .append(host)
                        .append(":")
                        .append(port)
                        .append("/")
                        .append(dbName);

                String query = uri.getQuery();
                if (query != null && !query.isBlank()) {
                    jdbcBuilder.append("?").append(query);
                } else if (host != null && !host.equals("localhost") && !host.endsWith("-a")) {
                    // External Render PostgreSQL connections require sslmode=require
                    jdbcBuilder.append("?sslmode=require");
                }

                return new ParsedDbInfo(jdbcBuilder.toString(), resolvedUser, resolvedPassword);
            } catch (Exception e) {
                log.warn("Failed to parse PostgreSQL URI: {}. Falling back to prefixing jdbc:", e.getMessage());
                return new ParsedDbInfo("jdbc:" + trimmed, configuredUsername, configuredPassword);
            }
        }

        return new ParsedDbInfo("jdbc:" + trimmed, configuredUsername, configuredPassword);
    }

    private static String maskUrl(String jdbcUrl) {
        if (jdbcUrl == null) return "null";
        return jdbcUrl.replaceAll(":[^/@]+@", ":***@");
    }

    public record ParsedDbInfo(String jdbcUrl, String username, String password) {
    }
}
