package com.stranded.backend.service;

import com.stranded.backend.entity.Score;
import com.stranded.backend.entity.User;
import com.stranded.backend.repository.ScoreRepository;
import com.stranded.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ScoreService {

    private final ScoreRepository scoreRepository;
    private final UserRepository userRepository;

    public ScoreService(ScoreRepository scoreRepository, UserRepository userRepository) {
        this.scoreRepository = scoreRepository;
        this.userRepository = userRepository;
    }

    public void submitScore(String username, int scoreValue, String gameMode, String timestampStr) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Parse timestamp or use current time if strict adherence to client timestamp
        // is not required for security?
        // Prompt says "Unity only sends the final score when the player dies".
        // Body includes "timestamp": "ISO-8601".
        // Ideally we should use server time to prevent cheating, but the contract says
        // it sends it.
        // Let's use server time for security, or parse if needed.
        // "Backend must NOT trust playerId from client".
        // It implies we should trust minimal info from client.
        // But let's follow the contract structure.

        Score score = new Score();
        score.setUser(user);
        score.setFinalScore(scoreValue);
        score.setGameMode(gameMode);
        score.setTimestamp(LocalDateTime.now()); // Using server time for security/consistency

        scoreRepository.save(score);
    }
}
