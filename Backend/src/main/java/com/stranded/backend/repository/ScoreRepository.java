package com.stranded.backend.repository;

import com.stranded.backend.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ScoreRepository extends JpaRepository<Score, Long> {

    @Query("SELECT s FROM Score s ORDER BY s.finalScore DESC")
    List<Score> findTopScores(Pageable pageable);
}
