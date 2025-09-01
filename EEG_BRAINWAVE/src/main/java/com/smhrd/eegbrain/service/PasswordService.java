package com.smhrd.eegbrain.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;

@Service
public class PasswordService {
    
    private final Argon2 argon2;
    private final BCryptPasswordEncoder bcryptEncoder; // 기존 BCrypt 비밀번호 호환성을 위해 유지
    
    public PasswordService() {
        this.argon2 = Argon2Factory.create();
        this.bcryptEncoder = new BCryptPasswordEncoder();
    }
    
    /**
     * 비밀번호를 Argon2로 암호화합니다.
     * @param rawPassword 원본 비밀번호
     * @return Argon2로 암호화된 비밀번호
     */
    public String encodePassword(String rawPassword) {
        try {
            return argon2.hash(2, 65536, 1, rawPassword.toCharArray());
        } finally {
            // 메모리에서 비밀번호 제거
            argon2.wipeArray(rawPassword.toCharArray());
        }
    }
    
    /**
     * 원본 비밀번호와 암호화된 비밀번호가 일치하는지 확인합니다.
     * BCrypt와 Argon2 모두 지원합니다.
     * @param rawPassword 원본 비밀번호
     * @param encodedPassword 암호화된 비밀번호
     * @return 일치 여부
     */
    public boolean matches(String rawPassword, String encodedPassword) {
        try {
            // Argon2 해시인지 확인 ($argon2로 시작)
            if (encodedPassword != null && encodedPassword.startsWith("$argon2")) {
                try {
                    return argon2.verify(encodedPassword, rawPassword.toCharArray());
                } catch (Exception e) {
                    // Argon2 검증 실패
                    return false;
                } finally {
                    // 메모리에서 비밀번호 제거
                    argon2.wipeArray(rawPassword.toCharArray());
                }
            }
            // BCrypt 해시인지 확인 ($2로 시작)
            else if (encodedPassword != null && encodedPassword.startsWith("$2")) {
                return bcryptEncoder.matches(rawPassword, encodedPassword);
            }
            // 평문 비밀번호 (기존 호환성)
            else {
                return encodedPassword != null && encodedPassword.equals(rawPassword);
            }
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 해시가 Argon2 방식인지 확인합니다.
     * @param encodedPassword 인코딩된 비밀번호
     * @return Argon2 해시 여부
     */
    public boolean isArgon2Hash(String encodedPassword) {
        return encodedPassword != null && encodedPassword.startsWith("$argon2");
    }
    
    /**
     * 해시가 BCrypt 방식인지 확인합니다.
     * @param encodedPassword 인코딩된 비밀번호
     * @return BCrypt 해시 여부
     */
    public boolean isBcryptHash(String encodedPassword) {
        return encodedPassword != null && encodedPassword.startsWith("$2");
    }
}
