package com.smhrd.eegbrain.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smhrd.eegbrain.entity.SessionEntity;

@Repository
public interface SessionRepository extends JpaRepository<SessionEntity, Integer> {
    List<SessionEntity> findByUserIdOrderBySessionIdxDesc(String userId);
}


