package com.smhrd.eegbrain.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smhrd.eegbrain.entity.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, String> {

    
	// 아이디가 DB에 있는지 체크하는 기능
	boolean existsById(String uid);
	
	// 로그인용 조회기능
	UserEntity findByUidAndPw(String uid,String pw);
	
	
	// 아이디로 회원정보 조회하는기능
	Optional<UserEntity> findByUid(String uid);
    
    // 휴대폰 번호로 첫 번째 일치 사용자 조회
    Optional<UserEntity> findFirstByPhone(String phone);
		
	
}
