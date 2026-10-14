package com.aiinterview.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String DEV_FALLBACK = "local-dev-jwt-secret-minimum-32-chars-long-1234567890";
    private static final String DEMO_FALLBACK = "local-demo-jwt-secret-minimum-32-chars-long-1234567890";

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expirationMs:86400000}")
    private long expirationMs;

    @Autowired(required = false)
    private Environment environment;

    @PostConstruct
    public void validateSecret() {
        boolean isProduction = environment != null
                && Arrays.asList(environment.getActiveProfiles()).contains("production");

        if (isProduction) {
            if (secret == null || secret.isBlank()) {
                throw new IllegalStateException("JWT_SECRET environment variable is missing in production.");
            }
            if (secret.equals(DEV_FALLBACK) || secret.equals(DEMO_FALLBACK)) {
                throw new IllegalStateException(
                        "JWT_SECRET cannot use default development/demo values in production. Please set a strong JWT_SECRET environment variable.");
            }
            if (secret.length() < 32) {
                throw new IllegalStateException(
                        "JWT_SECRET must be at least 32 characters (256 bits) long in production for HMAC-SHA256 security.");
            }
            log.info("JWT service initialized successfully for production.");
        } else {
            if (secret == null || secret.isBlank()) {
                log.warn("JWT secret is empty. Using secure local development fallback.");
                this.secret = DEV_FALLBACK;
            } else if (secret.length() < 32) {
                log.warn("JWT secret is shorter than 32 characters; key will be securely derived for local use.");
            }
        }
    }

    public String generateToken(String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    public String extractEmail(String token) {
        return parseAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseAllClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes;
        String trimmed = (secret != null) ? secret.trim() : DEV_FALLBACK;

        // Try Base64 decoding first if key looks like Base64 (common for generated secrets)
        try {
            byte[] decoded = Base64.getDecoder().decode(trimmed);
            if (decoded.length >= 32) {
                keyBytes = decoded;
            } else {
                keyBytes = trimmed.getBytes(StandardCharsets.UTF_8);
            }
        } catch (IllegalArgumentException e) {
            keyBytes = trimmed.getBytes(StandardCharsets.UTF_8);
        }

        // If still under 32 bytes (in non-production scenarios), hash with SHA-256 to ensure 256 bits
        if (keyBytes.length < 32) {
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                keyBytes = digest.digest(keyBytes);
            } catch (NoSuchAlgorithmException ex) {
                throw new RuntimeException("SHA-256 not available", ex);
            }
        }

        return Keys.hmacShaKeyFor(keyBytes);
    }
}
