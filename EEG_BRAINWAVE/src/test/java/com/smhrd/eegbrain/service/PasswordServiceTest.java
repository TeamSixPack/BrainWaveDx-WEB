package com.smhrd.eegbrain.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class PasswordServiceTest {

    @Autowired
    private PasswordService passwordService;

    @Test
    public void testArgon2PasswordEncoding() {
        String rawPassword = "testPassword123";
        
        // Argon2로 암호화
        String encodedPassword = passwordService.encodePassword(rawPassword);
        
        // Argon2 해시인지 확인
        assertTrue(passwordService.isArgon2Hash(encodedPassword));
        assertTrue(encodedPassword.startsWith("$argon2"));
        
        // 비밀번호 검증 테스트
        assertTrue(passwordService.matches(rawPassword, encodedPassword));
        assertFalse(passwordService.matches("wrongPassword", encodedPassword));
        
        System.out.println("Raw Password: " + rawPassword);
        System.out.println("Argon2 Hash: " + encodedPassword);
    }

    @Test
    public void testBCryptCompatibility() {
        // 기존 BCrypt 해시 (예시)
        String bcryptHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"; // "secret"
        
        // BCrypt 해시인지 확인
        assertTrue(passwordService.isBcryptHash(bcryptHash));
        
        // BCrypt 비밀번호 검증 (호환성 테스트)
        assertTrue(passwordService.matches("secret", bcryptHash));
        assertFalse(passwordService.matches("wrongPassword", bcryptHash));
    }

    @Test
    public void testPlainTextCompatibility() {
        String plainPassword = "plaintext123";
        
        // 평문 비밀번호 검증 (기존 호환성)
        assertTrue(passwordService.matches(plainPassword, plainPassword));
        assertFalse(passwordService.matches("wrongPassword", plainPassword));
    }
}

