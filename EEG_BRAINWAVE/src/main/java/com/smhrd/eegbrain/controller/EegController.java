package com.smhrd.eegbrain.controller;

import com.smhrd.eegbrain.dto.InferRequest;
import com.smhrd.eegbrain.dto.InferResponse;
import com.smhrd.eegbrain.service.FlaskClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EegController {

    private final FlaskClientService flaskClientService;

    @PostMapping("/infer-sync")
    public ResponseEntity<InferResponse> inferSync(@RequestBody InferRequest req) {
        InferResponse resp = flaskClientService.callInferSync(req);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/upload-eeg")
    public ResponseEntity<InferResponse> uploadEegFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "true_label", defaultValue = "CN") String trueLabel,
            @RequestParam(value = "subject_id", defaultValue = "test-subject") String subjectId,
            @RequestParam(value = "enforce_two_minutes", defaultValue = "true") String enforceTwoMinutes) {
        
        try {
            System.out.println("파일 업로드 요청 받음: " + file.getOriginalFilename());
            
            // Flask 서버의 dataset 폴더에 파일 저장
            String flaskDatasetDir = "../EEG_Flask/dataset/test-upload";
            Path uploadPath = Paths.get(flaskDatasetDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // 고유한 파일명 생성
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
            Path filePath = uploadPath.resolve(uniqueFilename);
            
            // 파일 저장
            Files.copy(file.getInputStream(), filePath);
            System.out.println("파일 저장 완료: " + filePath.toString());
            
            // Flask 서버가 찾을 수 있는 상대 경로로 변환
            String relativePath = "dataset/test-upload/" + uniqueFilename;
            
            // InferRequest 생성
            InferRequest req = new InferRequest();
            req.setFilePath(relativePath);  // Flask 서버가 찾을 수 있는 상대 경로 사용
            req.setTrueLabel(trueLabel);
            req.setSubjectId(subjectId);
            req.setEnforceTwoMinutes(Boolean.parseBoolean(enforceTwoMinutes));
            
            System.out.println("Flask 서버로 분석 요청 시작");
            // Flask 서버로 분석 요청
            InferResponse resp = flaskClientService.callInferSync(req);
            System.out.println("Flask 서버 분석 완료");
            
            return ResponseEntity.ok(resp);
            
        } catch (Exception e) {
            System.err.println("파일 업로드 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/infer-derivatives")
    public ResponseEntity<InferResponse> inferDerivativesFile(
            @RequestParam("file_path") String filePath,
            @RequestParam(value = "true_label", defaultValue = "CN") String trueLabel,
            @RequestParam(value = "subject_id", defaultValue = "test-subject") String subjectId,
            @RequestParam(value = "enforce_two_minutes", defaultValue = "true") String enforceTwoMinutes) {
        
        try {
            System.out.println("Derivatives 파일 분석 요청 받음: " + filePath);
            
            // derivatives 폴더의 파일 경로를 Flask 서버가 이해할 수 있는 형태로 변환
            String relativePath;
            if (filePath.contains("derivatives")) {
                // derivatives 폴더의 파일인 경우 상대 경로 그대로 사용
                relativePath = filePath;
            } else {
                // 기타 파일인 경우 dataset 폴더 기준으로 처리
                relativePath = "dataset/test-upload/" + filePath;
            }
            
            // InferRequest 생성
            InferRequest req = new InferRequest();
            req.setFilePath(relativePath);
            req.setTrueLabel(trueLabel);
            req.setSubjectId(subjectId);
            req.setEnforceTwoMinutes(Boolean.parseBoolean(enforceTwoMinutes));
            
            System.out.println("Flask 서버로 derivatives 파일 분석 요청 시작");
            // Flask 서버로 분석 요청
            InferResponse resp = flaskClientService.callInferSync(req);
            System.out.println("Flask 서버 derivatives 파일 분석 완료");
            
            return ResponseEntity.ok(resp);
            
        } catch (Exception e) {
            System.err.println("Derivatives 파일 분석 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok("spring-ok");
    }

    @PostMapping("/test-upload")
    public ResponseEntity<?> testUpload(@RequestParam("file") MultipartFile file) {
        try {
            System.out.println("테스트 파일 업로드 받음: " + file.getOriginalFilename());
            System.out.println("파일 크기: " + file.getSize() + " bytes");
            return ResponseEntity.ok("파일 업로드 성공: " + file.getOriginalFilename());
        } catch (Exception e) {
            System.err.println("테스트 업로드 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("오류: " + e.getMessage());
        }
    }
}
