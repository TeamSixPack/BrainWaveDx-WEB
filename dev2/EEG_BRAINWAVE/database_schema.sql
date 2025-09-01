-- NeuroScan 뇌 건강 검사 시스템 데이터베이스 스키마

-- 사용자 테이블
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 검사 기록 테이블
CREATE TABLE assessment_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    assessment_date DATETIME NOT NULL,
    eeg_result VARCHAR(50), -- 정상, 전측두엽장애, 치매 등
    moca_score INT, -- MOCA 점수 (0-30)
    mmse_score INT, -- MMSE 점수 (0-30)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_assessment_records_user_id ON assessment_records(user_id);
CREATE INDEX idx_assessment_records_date ON assessment_records(assessment_date);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 샘플 데이터 (테스트용)
INSERT INTO users (username, email, password) VALUES 
('testuser', 'test@example.com', '$2a$10$example_hash'),
('admin', 'admin@example.com', '$2a$10$example_hash');

-- 샘플 검사 기록 (테스트용)
INSERT INTO assessment_records (user_id, assessment_date, eeg_result, moca_score, mmse_score) VALUES 
(1, '2025-08-27 14:00:00', '정상', 24, 23),
(1, '2025-08-20 10:30:00', '정상', 22, 21),
(2, '2025-08-25 16:00:00', '전측두엽장애', 18, 17);
