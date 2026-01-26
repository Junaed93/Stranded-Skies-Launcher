package com.stranded.backend.controller;

import com.stranded.backend.entity.Score;
import com.stranded.backend.repository.ScoreRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final ScoreRepository scoreRepository;

    public LeaderboardController(ScoreRepository scoreRepository) {
        this.scoreRepository = scoreRepository;
    }

    @GetMapping
    public ResponseEntity<List<LeaderboardEntry>> getLeaderboard() {
        List<Score> topScores = scoreRepository.findTopScores(PageRequest.of(0, 50)); // Fetch more to filter

        List<LeaderboardEntry> leaderboard = topScores.stream()
                .filter(score -> !score.getUser().isGuest()) // Hide guests
                .limit(10) // Top 10 registered users
                .map(score -> new LeaderboardEntry(
                        score.getUser().getUsername(),
                        score.getFinalScore(),
                        score.getGameMode()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(leaderboard);
    }

    public static class LeaderboardEntry {
        private String username;
        private int score;
        private String gameMode;

        public LeaderboardEntry(String username, int score, String gameMode) {
            this.username = username;
            this.score = score;
            this.gameMode = gameMode;
        }

        public String getUsername() {
            return username;
        }

        public int getScore() {
            return score;
        }

        public String getGameMode() {
            return gameMode;
        }
    }
}
