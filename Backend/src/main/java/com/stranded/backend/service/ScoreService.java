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

        Score score = new Score();
        score.setUser(user);
        score.setFinalScore(scoreValue);
        score.setGameMode(gameMode);
        score.setTimestamp(LocalDateTime.now());

        scoreRepository.save(score);
    }
}
