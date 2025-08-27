-- NeuroScan 데이터베이스 스키마 (간단한 테스트용)
-- MySQL 8.0 이상에서 실행

-- 기존 테이블 삭제 (필요시)
-- DROP TABLE IF EXISTS assessment_records;
-- DROP TABLE IF EXISTS users;

-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(50) PRIMARY KEY,
    pw VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 검사 기록 테이블 생성
CREATE TABLE IF NOT EXISTS assessment_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    assessment_date TIMESTAMP NOT NULL,
    eeg_result VARCHAR(50),
    moca_score INT,
    mmse_score INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE,
    INDEX idx_user_assessment_date (user_id, assessment_date),
    INDEX idx_assessment_date (assessment_date)
);

-- 테스트 데이터 삽입

-- 1. test 사용자 생성 (비밀번호: 1234)
INSERT INTO users (uid, pw, name, phone) VALUES
('test', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '테스트', '010-1234-5678')
ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone);

-- 2. test 사용자의 검사 기록 생성 (다양한 결과와 점수)
INSERT INTO assessment_records (user_id, assessment_date, eeg_result, moca_score, mmse_score) VALUES
-- 오늘 검사
('test', NOW(), '정상', 28, 29),
-- 어제 검사
('test', DATE_SUB(NOW(), INTERVAL 1 DAY), '전측두엽장애', 22, 25),
-- 3일 전 검사
('test', DATE_SUB(NOW(), INTERVAL 3 DAY), '정상', 26, 28),
-- 1주일 전 검사
('test', DATE_SUB(NOW(), INTERVAL 7 DAY), '치매', 18, 20),
-- 2주일 전 검사
('test', DATE_SUB(NOW(), INTERVAL 14 DAY), '정상', 27, 29),
-- 1개월 전 검사
('test', DATE_SUB(NOW(), INTERVAL 30 DAY), '전측두엽장애', 21, 24),
-- 2개월 전 검사
('test', DATE_SUB(NOW(), INTERVAL 60 DAY), '정상', 25, 27),
-- 3개월 전 검사
('test', DATE_SUB(NOW(), INTERVAL 90 DAY), '치매', 19, 22),
-- 6개월 전 검사
('test', DATE_SUB(NOW(), INTERVAL 180 DAY), '정상', 26, 28),
-- 1년 전 검사
('test', DATE_SUB(NOW(), INTERVAL 365 DAY), '전측두엽장애', 23, 26);

-- 검사 기록 조회 테스트
-- SELECT 
--     ar.id,
--     ar.user_id,
--     u.name,
--     ar.assessment_date,
--     ar.eeg_result,
--     ar.moca_score,
--     ar.mmse_score,
--     ar.created_at
-- FROM assessment_records ar
-- JOIN users u ON ar.user_id = ar.uid
-- WHERE ar.user_id = 'test'
-- ORDER BY ar.assessment_date DESC;
