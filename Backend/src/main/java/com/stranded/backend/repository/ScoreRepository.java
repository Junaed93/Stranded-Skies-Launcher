package com.stranded.backend.repository;

import com.stranded.backend.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ScoreRepository extends JpaRepository<Score, Long> {

    @Query("SELECT s FROM Score s JOIN FETCH s.user ORDER BY s.finalScore DESC")
    List<Score> findTopScores(Pageable pageable);

    @Query("SELECT s FROM Score s JOIN FETCH s.user WHERE s.id IN " +
            "(SELECT s2.id FROM Score s2 WHERE s2.finalScore = " +
            "(SELECT MAX(s3.finalScore) FROM Score s3 WHERE s3.user.id = s2.user.id) " +
            "GROUP BY s2.user.id) " +
            "ORDER BY s.finalScore DESC")
    List<Score> findHighestScorePerUserPerMode(Pageable pageable);
}
