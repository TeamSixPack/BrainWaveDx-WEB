package com.smhrd.eegbrain.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smhrd.eegbrain.entity.UserEntity;
import com.smhrd.eegbrain.service.UserService;

@RestController
public class UserRestController {

	@Autowired
	UserService userService;
	
    // 아이디 중복 확인 (AJAX 요청 처리)
    @PostMapping("/checkId")
    public ResponseEntity<Map<String, Object>> checkIdDuplicate(@RequestParam("uid") String uid) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (uid == null || uid.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "아이디를 입력해주세요.");
                return ResponseEntity.badRequest().body(response);
            }
            
            boolean isDuplicate = userService.isIdDuplicate(uid);
            
            response.put("success", true);
            response.put("isDuplicate", isDuplicate);
            response.put("message", isDuplicate ? "이미 사용 중인 아이디입니다." : "사용 가능한 아이디입니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "아이디 중복 확인 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    // 비밀번호 변경 API
    @PostMapping("/api/changePassword")
    public ResponseEntity<Map<String, Object>> changePassword(
            @RequestParam("uid") String uid,
            @RequestParam("currentPw") String currentPw,
            @RequestParam("newPw") String newPw) {
        Map<String, Object> response = new HashMap<>();
        try {
            // 안전을 위해 앞뒤 공백 제거
            if (uid != null) uid = uid.trim();
            if (currentPw != null) currentPw = currentPw.trim();
            if (newPw != null) newPw = newPw.trim();

            Optional<UserEntity> userOpt = userService.findByUid(uid);
            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "존재하지 않는 아이디입니다.");
                return ResponseEntity.badRequest().body(response);
            }

            UserEntity user = userOpt.get();
            if (!userService.checkPassword(user, currentPw)) {
                response.put("success", false);
                response.put("message", "현재 비밀번호가 일치하지 않습니다.");
                return ResponseEntity.badRequest().body(response);
            }

            if (newPw == null || newPw.trim().length() < 4) {
                response.put("success", false);
                response.put("message", "새 비밀번호는 4자 이상이어야 합니다.");
                return ResponseEntity.badRequest().body(response);
            }

            userService.updatePassword(user, newPw);

            response.put("success", true);
            response.put("message", "비밀번호가 변경되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "비밀번호 변경 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // 회원가입 API
    @PostMapping("/api/signup")
    public ResponseEntity<Map<String, Object>> signup(
            @RequestParam("uid") String uid,
            @RequestParam("pw") String pw,
            @RequestParam("name") String name,
            @RequestParam("phone") String phone) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 아이디 중복 확인
            if (userService.isIdDuplicate(uid)) {
                response.put("success", false);
                response.put("message", "이미 사용 중인 아이디입니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 사용자 엔티티 생성
            UserEntity user = new UserEntity();
            user.setUid(uid);
            user.setPw(pw);
            user.setName(name);
            user.setPhone(phone);
            
            // 사용자 등록
            UserEntity savedUser = userService.registerUser(user);
            
            response.put("success", true);
            response.put("message", "회원가입이 완료되었습니다.");
            response.put("user", savedUser);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "회원가입 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    // 로그인 API
    @PostMapping("/api/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestParam("uid") String uid,
            @RequestParam("pw") String pw) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 아이디 존재 여부 확인
            Optional<UserEntity> userOpt = userService.findByUid(uid);
            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "존재하지 않는 아이디입니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            UserEntity user = userOpt.get();
            
            // 비밀번호 확인
            if (!userService.checkPassword(user, pw)) {
                response.put("success", false);
                response.put("message", "비밀번호가 일치하지 않습니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 로그인 성공
            response.put("success", true);
            response.put("message", "로그인 성공");
            response.put("user", Map.of(
                "uid", user.getUid(),
                "name", user.getName(),
                "phone", user.getPhone()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "로그인 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    // 비밀번호 찾기 API (휴대폰 번호 또는 아이디)
    @PostMapping("/api/findPassword")
    public ResponseEntity<Map<String, Object>> findPassword(
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "uid", required = false) String uid) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<UserEntity> userOpt = Optional.empty();
            if (phone != null && !phone.trim().isEmpty()) {
                userOpt = userService.findByPhone(phone);
            } else if (uid != null && !uid.trim().isEmpty()) {
                userOpt = userService.findByUid(uid);
            }
            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "해당 정보로 가입된 사용자를 찾을 수 없습니다.");
                return ResponseEntity.badRequest().body(response);
            }
            
            UserEntity user = userOpt.get();
            
            // 보안을 위해 임시 비밀번호 생성 (실제로는 이메일이나 SMS로 전송)
            String tempPassword = generateTempPassword();
            
            // 임시 비밀번호로 업데이트(해시 적용)
            userService.updatePassword(user, tempPassword);
            
            response.put("success", true);
            response.put("message", "비밀번호를 확인했습니다.");
            response.put("tempPassword", tempPassword);
            response.put("user", Map.of(
                "uid", user.getUid(),
                "name", user.getName()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "비밀번호 찾기 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    // 임시 비밀번호 생성
    private String generateTempPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            int index = (int) (Math.random() * chars.length());
            sb.append(chars.charAt(index));
        }
        return sb.toString();
    }
}
