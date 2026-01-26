package com.stranded.backend.service;

import com.stranded.backend.entity.User;
import com.stranded.backend.repository.UserRepository;
import com.stranded.backend.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public String register(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setGuest(false);
        userRepository.save(user);
        return jwtUtil.generateToken(username, false);
    }

    public String login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        return jwtUtil.generateToken(username, false);
    }

    public GuestLoginResult guestLogin() {
        String username = "Guest_" + UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setUsername(username);
        user.setGuest(true);
        // Guests have no password
        userRepository.save(user);
        String token = jwtUtil.generateToken(username, true);
        return new GuestLoginResult(token, username);
    }

    public String upgradeGuest(String currentUsername, String newUsername, String newPassword) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Guest user not found"));

        if (!user.isGuest()) {
            throw new RuntimeException("User is already registered");
        }

        if (userRepository.findByUsername(newUsername).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        user.setUsername(newUsername);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setGuest(false);
        userRepository.save(user);

        return jwtUtil.generateToken(newUsername, false);
    }

    public static class GuestLoginResult {
        private final String token;
        private final String username;

        public GuestLoginResult(String token, String username) {
            this.token = token;
            this.username = username;
        }

        public String getToken() {
            return token;
        }

        public String getUsername() {
            return username;
        }
    }
}
