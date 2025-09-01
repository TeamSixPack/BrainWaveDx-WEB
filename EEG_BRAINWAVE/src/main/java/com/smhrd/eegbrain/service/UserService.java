package com.smhrd.eegbrain.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smhrd.eegbrain.entity.UserEntity;
import com.smhrd.eegbrain.repository.UserRepository;

@Service
public class UserService {
	
	@Autowired
	private UserRepository userRepository;
	
	@Autowired
	private PasswordService passwordService;
	
    // 로그인 처리 (기존 평문/BCrypt 비밀번호를 안전하게 Argon2 해시로 업그레이드)
    public Optional<UserEntity> login(String uid, String pw) {
        Optional<UserEntity> userOpt = userRepository.findByUid(uid);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        UserEntity user = userOpt.get();
        String stored = user.getPw();

        // Argon2 해시인 경우
        if (passwordService.isArgon2Hash(stored)) {
            if (passwordService.matches(pw, stored)) {
                return userOpt;
            }
            return Optional.empty();
        }
        
        // BCrypt 해시인 경우 - 로그인 성공 시 Argon2로 업그레이드
        if (passwordService.isBcryptHash(stored)) {
            if (passwordService.matches(pw, stored)) {
                // BCrypt에서 Argon2로 업그레이드
                updatePassword(user, pw);
                return Optional.of(user);
            }
            return Optional.empty();
        }

        // 기존 평문 저장 사용자: 평문 비교 성공 시 즉시 Argon2 해시로 업그레이드
        if (stored != null && stored.equals(pw)) {
            updatePassword(user, pw);
            return Optional.of(user);
        }

        return Optional.empty();
    }
    
    // 아이디로 사용자 조회
    public Optional<UserEntity> findByUid(String uid) {
        return userRepository.findByUid(uid);
    }
    
    // 휴대폰 번호로 사용자 조회
    public Optional<UserEntity> findByPhone(String phone) {
        return userRepository.findFirstByPhone(phone);
    }

    // 비밀번호 검증
    public boolean checkPassword(UserEntity user, String rawPassword) {
        return passwordService.matches(rawPassword, user.getPw());
    }

    // 회원가입 처리
    public UserEntity registerUser(UserEntity user) {
        // 비밀번호 암호화
        String encodedPassword = passwordService.encodePassword(user.getPw());
        user.setPw(encodedPassword);
        
        return userRepository.save(user);
    }    
    
    // 아이디 중복 확인
    public boolean isIdDuplicate(String uid) {
        return userRepository.existsById(uid);
    }

    // 회원 기본정보 수정
    public void updateBasicInfo(UserEntity user) {
    	userRepository.save(user);
    }    

    // 비밀번호만 변경(해시 적용)
    public void updatePassword(UserEntity user, String rawPassword) {
        String encoded = passwordService.encodePassword(rawPassword);
        user.setPw(encoded);
        userRepository.save(user);
    }
}
