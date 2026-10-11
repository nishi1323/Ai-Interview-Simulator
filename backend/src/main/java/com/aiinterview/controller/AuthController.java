package com.aiinterview.controller;

import com.aiinterview.dto.AuthRequest;
import com.aiinterview.dto.AuthResponse;
import com.aiinterview.dto.RegisterRequest;
import com.aiinterview.dto.UserProfileResponse;
import com.aiinterview.dto.UserProfileUpdateRequest;
import com.aiinterview.entity.User;
import com.aiinterview.security.JwtService;
import com.aiinterview.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.registerUser(request);
        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getName()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (AuthenticationException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        if (authentication.isAuthenticated()) {
            User user = userService.findByEmail(request.getEmail());
            String token = jwtService.generateToken(user.getEmail());
            return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getName()));
        }
        throw new IllegalArgumentException("Invalid login credentials");
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> me(Authentication authentication) {
        requireAuthenticated(authentication);
        return ResponseEntity.ok(UserProfileResponse.from(userService.findByEmail(authentication.getName())));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMe(@Valid @RequestBody UserProfileUpdateRequest request,
                                                        Authentication authentication) {
        requireAuthenticated(authentication);
        return ResponseEntity.ok(UserProfileResponse.from(userService.updateProfile(authentication.getName(), request)));
    }

    private void requireAuthenticated(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
    }
}
