package com.aiinterview.service;

import com.aiinterview.dto.UserProfileUpdateRequest;
import com.aiinterview.entity.User;
import com.aiinterview.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserServiceTest {
    @Test
    void profileUpdateChangesOnlyEditableProfileFields() {
        User user = new User();
        user.setEmail("person@example.test");
        user.setPassword("encoded-password");
        user.setName("Original Name");

        UserRepository repository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(repository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(repository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserService service = new UserService(repository, encoder);
        UserProfileUpdateRequest request = new UserProfileUpdateRequest();
        request.setName(" Updated Name ");
        request.setPhone(" 555 1234 ");
        request.setExperienceLevel("3-5 years");

        User updated = service.updateProfile(user.getEmail(), request);

        assertThat(updated.getName()).isEqualTo("Updated Name");
        assertThat(updated.getPhone()).isEqualTo("555 1234");
        assertThat(updated.getExperienceLevel()).isEqualTo("3-5 years");
        assertThat(updated.getEmail()).isEqualTo("person@example.test");
        assertThat(updated.getPassword()).isEqualTo("encoded-password");
    }
}