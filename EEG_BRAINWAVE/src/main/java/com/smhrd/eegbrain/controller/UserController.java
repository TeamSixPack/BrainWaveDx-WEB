package com.smhrd.eegbrain.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.RedirectView;

import com.smhrd.eegbrain.entity.UserEntity;
import com.smhrd.eegbrain.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@Controller
public class UserController {

	@Autowired
	private UserService userService;	
	
	// 로그인 기능
	@PostMapping(value = "/login.do")
	public ResponseEntity<?> login(@RequestParam("id") String uid, @RequestParam String pw, HttpSession session) {

		// 1. 아이디 존재 여부 확인
		Optional<UserEntity> userOpt = userService.findByUid(uid);
		if (!userOpt.isPresent()) {
			return errorResponse("id", "존재하지 않는 아이디입니다");
		}

		UserEntity user = userOpt.get();

		// 2. 비밀번호 일치 여부 확인
		if (!userService.checkPassword(user, pw)) {
			return errorResponse("pw", "비밀번호가 일치하지 않습니다");
		}

		// 로그인 성공 처리
		session.setAttribute("user", user);
		
		// 역할에 따른 리다이렉트 URL 설정
		return ResponseEntity.ok("/mainPage");

	}
	
	// 로그아웃 기능
	@GetMapping(value = "/logout.do")
	public String logout(HttpSession session) {
		session.invalidate();
		return "redirect:/mainPage";
	}
	
	// 비밀번호 실패시 에러메세지 출력기능
	private ResponseEntity<Map<String, String>> errorResponse(String field, String message) {
		Map<String, String> response = new HashMap<>();
		response.put("field", field);
		response.put("message", message);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
	}	
	
	// 회원가입 기능
	@PostMapping({ "/join.do" })
	public ModelAndView joinUser(@RequestParam("id") String uid, @RequestParam("pw") String pw,
			@RequestParam("name") String name, @RequestParam("phone") String phone,
			Model model, HttpServletRequest request) {

		UserEntity user = new UserEntity();
		user.setUid(uid);
		user.setPw(pw);
		user.setName(name);
		user.setPhone(phone);

		try {
			userService.registerUser(user);

			// 성공 시
			// ModelAndView 객체를 생성
			ModelAndView mav = new ModelAndView();
			// 'message' 파라미터에 성공 메시지를 담아 리다이렉트
			RedirectView redirectView = new RedirectView("/loginPage");
			redirectView.addStaticAttribute("message", "회원가입이 완료되었습니다.");
			mav.setView(redirectView);
			return mav;

		} catch (Exception e) {
			System.err.println("회원가입 처리 중 예외 발생: " + e.getMessage());
			e.printStackTrace();

			// 에러 발생 시
			// 회원가입 페이지로 다시 이동
			ModelAndView mav = new ModelAndView();
			// 'error' 파라미터에 에러 메시지를 담아 리다이렉트
			RedirectView redirectView = new RedirectView("/joinPage");
			redirectView.addStaticAttribute("error", "회원가입에 실패했습니다.");
			mav.setView(redirectView);
			return mav;
		}
	}
}
