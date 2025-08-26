package com.smhrd.eegbrain.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smhrd.eegbrain.entity.CognitiveEntity;
import com.smhrd.eegbrain.entity.CognitiveType;
import com.smhrd.eegbrain.repository.CognitiveRepository;

@Service
public class CognitiveService {

    @Autowired
    private CognitiveRepository cognitiveRepository;

    public CognitiveEntity saveScore(Integer sessionIdx, CognitiveType type, int score) {
        Optional<CognitiveEntity> existing = cognitiveRepository.findBySessionIdxAndCognitiveType(sessionIdx, type);
        CognitiveEntity entity = existing.orElseGet(CognitiveEntity::new);
        entity.setSessionIdx(sessionIdx);
        entity.setCognitiveType(type);
        entity.setCognitiveScore(score);
        return cognitiveRepository.save(entity);
    }

    public Optional<CognitiveEntity> findBySessionAndType(Integer sessionIdx, CognitiveType type) {
        return cognitiveRepository.findBySessionIdxAndCognitiveType(sessionIdx, type);
    }

    public List<CognitiveEntity> findBySession(Integer sessionIdx) {
        return cognitiveRepository.findBySessionIdx(sessionIdx);
    }
}


