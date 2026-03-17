package com.banking.app.service;

import com.banking.app.dto.UpdateProfileRequest;
import com.banking.app.dto.UserResponse;
import com.banking.app.entity.Role;
import com.banking.app.entity.User;
import com.banking.app.exception.BadRequestException;
import com.banking.app.exception.ResourceNotFoundException;
import com.banking.app.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public User findByEmailOrThrow(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = findByEmailOrThrow(email);

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (!normalizedEmail.equalsIgnoreCase(user.getEmail())
                && userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BadRequestException("Email already exists");
        }

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEmail(normalizedEmail);

        return new UserResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream().map(UserResponse::new).toList();
    }

    @Transactional
    public UserResponse updateUserStatus(String requesterEmail, Long targetUserId, boolean isActive) {
        User requester = findByEmailOrThrow(requesterEmail);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (requester.getId().equals(targetUser.getId()) && !isActive) {
            throw new BadRequestException("You cannot deactivate your own account");
        }

        targetUser.setIsActive(isActive);
        return new UserResponse(userRepository.save(targetUser));
    }

    @Transactional
    public UserResponse updateUserRole(String requesterEmail, Long targetUserId, Role role) {
        User requester = findByEmailOrThrow(requesterEmail);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (requester.getId().equals(targetUser.getId())) {
            throw new BadRequestException("You cannot modify your own role");
        }

        targetUser.setRole(role);
        return new UserResponse(userRepository.save(targetUser));
    }
}
