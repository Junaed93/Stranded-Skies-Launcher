package com.stranded.backend.controller;

import com.stranded.backend.service.ScoreService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {

    private final ScoreService scoreService;

    public ScoreController(ScoreService scoreService) {
        this.scoreService = scoreService;
    }

    @PostMapping
    public ResponseEntity<?> submitScore(@RequestBody ScoreRequest request, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        String username = authentication.getName();

        // request.getPlayerId() is ignored as per rules: "Backend must NOT trust
        // playerId from client"

        scoreService.submitScore(username, request.getFinalScore(), request.getGameMode(), request.getTimestamp());

        return ResponseEntity.ok(Map.of("message", "Score submitted successfully"));
    }

    public static class ScoreRequest {
        private int finalScore;
        private String gameMode;
        private String timestamp;
        private String playerId;

        public int getFinalScore() {
            return finalScore;
        }

        public void setFinalScore(int finalScore) {
            this.finalScore = finalScore;
        }

        public String getGameMode() {
            return gameMode;
        }

        public void setGameMode(String gameMode) {
            this.gameMode = gameMode;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }

        public String getPlayerId() {
            return playerId;
        }

        public void setPlayerId(String playerId) {
            this.playerId = playerId;
        }
    }
}
