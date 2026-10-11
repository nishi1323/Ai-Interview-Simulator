package com.aiinterview.service;

import com.aiinterview.dto.RegisterRequest;
import com.aiinterview.dto.UserProfileUpdateRequest;
import com.aiinterview.entity.User;
import com.aiinterview.exception.ResourceNotFoundException;
import com.aiinterview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An account with this email already exists. Sign in instead.");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setExperienceLevel(request.getExperienceLevel());
        user.setCreatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    public User updateProfile(String email, UserProfileUpdateRequest request) {
        User user = findByEmail(email);
        user.setName(request.getName().trim());
        user.setPhone(request.getPhone() == null ? null : request.getPhone().trim());
        user.setExperienceLevel(request.getExperienceLevel() == null ? null : request.getExperienceLevel().trim());
        return userRepository.save(user);
    }
}
