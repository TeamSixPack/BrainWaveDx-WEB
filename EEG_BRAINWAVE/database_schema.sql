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
    uid BIGINT NOT NULL,
    assessment_date DATETIME NOT NULL,
    eeg_result VARCHAR(50), -- 정상, 전측두엽장애, 치매 등
    moca_score INT, -- MOCA 점수 (0-30)
    mmse_score INT, -- MMSE 점수 (0-30)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- 음성 상담 기록 테이블
CREATE TABLE voice_consultation_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uid BIGINT NOT NULL,
    raw_data TEXT NOT NULL, -- 사용자가 말한 원본 텍스트
    ai_summary TEXT NOT NULL, -- AI가 요약한 텍스트
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_assessment_records_uid ON assessment_records(uid);
CREATE INDEX idx_assessment_records_date ON assessment_records(assessment_date);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_voice_consultation_uid ON voice_consultation_records(uid);
CREATE INDEX idx_voice_consultation_created_at ON voice_consultation_records(created_at);
CREATE INDEX idx_voice_consultation_type ON voice_consultation_records(consultation_type);

-- 샘플 데이터 (테스트용)
INSERT INTO users (username, email, password) VALUES 
('testuser', 'test@example.com', '$2a$10$example_hash'),
('admin', 'admin@example.com', '$2a$10$example_hash');

-- 샘플 검사 기록 (테스트용)
INSERT INTO assessment_records (uid, assessment_date, eeg_result, moca_score, mmse_score) VALUES 
(1, '2025-08-27 14:00:00', '정상', 24, 23),
(1, '2025-08-20 10:30:00', '정상', 22, 21),
(2, '2025-08-25 16:00:00', '전측두엽장애', 18, 17);

-- 샘플 음성 상담 기록 (테스트용)
INSERT INTO voice_consultation_records (uid, raw_data, ai_summary, consultation_type) VALUES 
(1, '최근에 자주 물건을 어디에 두었는지 까먹고, 중요한 일정도 잊어버리는 것 같아요.', '사용자의 음성 응답을 분석한 결과, 최근 기억력 저하 증상이 관찰됩니다. 물건을 자주 잃어버리고, 중요한 일정을 까먹는 경험이 있다고 하셨습니다. 이는 일시적인 스트레스나 피로로 인한 것일 수 있으나, 지속적인 증상이라면 전문의와 상담을 권장합니다.', 'memory_helper'),
(1, '대화 중에 단어가 잘 떠오르지 않아서 곤란했던 적이 있어요.', '대화 중 단어 인출의 어려움을 경험하고 있다고 하셨습니다. 이는 일시적인 건망증 가능성이 있으며, 충분한 수면, 규칙적인 생활, 메모 습관 등이 도움이 됩니다.', 'memory_chatbot');
