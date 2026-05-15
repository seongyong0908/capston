-- DB 테이블 만드는 파일

-- 1. 유저 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    disliked_foods TEXT,
    preferred_style VARCHAR(100)
);

-- 2. 코스 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS course (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    total_distance DOUBLE,
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- 3. 장소 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS place (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    place_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    visit_order INT NOT NULL,
    description TEXT,
    FOREIGN KEY (course_id) REFERENCES course(id)
);