package com.smhrd.eegbrain.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smhrd.eegbrain.entity.SessionEntity;
import com.smhrd.eegbrain.repository.SessionRepository;

@Service
public class SessionService {

    @Autowired
    private SessionRepository sessionRepository;

    public SessionEntity startSession(String userId) {
        SessionEntity s = new SessionEntity();
        s.setUserId(userId);
        s.setStartTime(LocalDateTime.now());
        return sessionRepository.save(s);
    }

    public Optional<SessionEntity> endSession(Integer sessionIdx) {
        Optional<SessionEntity> opt = sessionRepository.findById(sessionIdx);
        opt.ifPresent(s -> {
            s.setEndTime(LocalDateTime.now());
            sessionRepository.save(s);
        });
        return opt;
    }

    public Optional<SessionEntity> saveEegResult(Integer sessionIdx, String eegResult) {
        Optional<SessionEntity> opt = sessionRepository.findById(sessionIdx);
        opt.ifPresent(s -> {
            s.setEegResult(eegResult);
            sessionRepository.save(s);
        });
        return opt;
    }

    public List<SessionEntity> findUserSessionsDesc(String userId) {
        return sessionRepository.findByUserIdOrderBySessionIdxDesc(userId);
    }
}


