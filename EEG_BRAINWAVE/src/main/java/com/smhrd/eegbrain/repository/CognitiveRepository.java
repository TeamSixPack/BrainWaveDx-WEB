package com.smhrd.eegbrain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smhrd.eegbrain.entity.CognitiveEntity;
import com.smhrd.eegbrain.entity.CognitiveType;

@Repository
public interface CognitiveRepository extends JpaRepository<CognitiveEntity, Integer> {
    Optional<CognitiveEntity> findBySessionIdxAndCognitiveType(Integer sessionIdx, CognitiveType cognitiveType);
    List<CognitiveEntity> findBySessionIdx(Integer sessionIdx);
}


