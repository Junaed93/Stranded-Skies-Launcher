package com.stranded.backend.controller;

import com.stranded.backend.repository.ScoreRepository;
import com.stranded.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ScoreRepository scoreRepository;
    private final UserRepository userRepository;

    public AdminController(ScoreRepository scoreRepository, UserRepository userRepository) {
        this.scoreRepository = scoreRepository;
        this.userRepository = userRepository;
    }

    @DeleteMapping("/reset")
    @Transactional
    public ResponseEntity<?> resetDatabase() {
        long scoreCount = scoreRepository.count();
        long userCount = userRepository.count();

        scoreRepository.deleteAll();
        userRepository.deleteAll();

        return ResponseEntity.ok(Map.of(
                "message", "Database cleared successfully",
                "scoresDeleted", scoreCount,
                "usersDeleted", userCount));
    }
}
