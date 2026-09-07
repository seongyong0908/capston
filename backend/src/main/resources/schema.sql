-- 1. 회원 테이블
CREATE TABLE IF NOT EXISTS user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    login_id VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100)
);

-- 2. 사용자 취향 테이블
CREATE TABLE IF NOT EXISTS preference (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    like_vibe VARCHAR(255),
    hate_act VARCHAR(255),
    food_limit VARCHAR(255),
    food_memo TEXT,
    CONSTRAINT fk_preference_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- 3. 방 자체 정보 테이블
CREATE TABLE IF NOT EXISTS room (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(225),
    room_type VARCHAR(50),
    invite_code VARCHAR(50)
);

-- 4. 방 멤버 매핑 테이블
CREATE TABLE IF NOT EXISTS room_member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,       
    room_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) DEFAULT 'MEMBER',
    status VARCHAR(50) DEFAULT 'PENDING',
    CONSTRAINT fk_room_member_room FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE,
    CONSTRAINT fk_room_member_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- 5. AI 코스 요청 내역 테이블
CREATE TABLE IF NOT EXISTS ai_request (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    target_region VARCHAR(100),
    target_budget INT,
    transportation VARCHAR(100), 
    duration VARCHAR(100),
    CONSTRAINT fk_ai_request_room FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE
);

-- 6. 추천된 코스 테이블 (단수형 course)
CREATE TABLE IF NOT EXISTS course (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    course_title VARCHAR(150),
    is_selected BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_course_room FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE
);

-- 7. 장소 테이블 (course 참조)
CREATE TABLE IF NOT EXISTS place (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT,
    place_name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    address VARCHAR(255),
    description TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    opening_hours VARCHAR(255),
    rating DECIMAL(3, 2),
    visit_order INT,
    CONSTRAINT fk_place_course FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE
);

-- 8. 유저 코스 보관함 테이블 (단수형 saved_course)
CREATE TABLE IF NOT EXISTS saved_course (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    status VARCHAR(20),
    CONSTRAINT fk_saved_course_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_course_course FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE
);

-- 9. 코스별 리뷰 테이블 (단수형 review)
CREATE TABLE IF NOT EXISTS review (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    rating INT,
    content TEXT,
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_course FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE
);