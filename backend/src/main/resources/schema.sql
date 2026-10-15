-- 1. 회원 테이블
CREATE TABLE IF NOT EXISTS user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    login_id VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NULL UNIQUE,
    email VARCHAR(100),
    provider VARCHAR(255)
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

-- 5. 사용자가 선택해 보관하거나 일정에 추가한 코스
CREATE TABLE IF NOT EXISTS course (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    room_id BIGINT NULL,
    course_title VARCHAR(150) NOT NULL,
    region VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'SAVED',
    planned_date DATE NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    CONSTRAINT fk_course_user
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_room
        FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE SET NULL
);

-- 6. 전체 추천 장소 목록 (코스별 연결 정보는 course_place에서 관리)
CREATE TABLE IF NOT EXISTS place (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    place_name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    subcategory VARCHAR(255),
    address VARCHAR(255),
    description TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    region VARCHAR(255),
    phone VARCHAR(255),
    opening_hours VARCHAR(255),
    tags VARCHAR(255),
    rating DECIMAL(3, 2)
);

-- 7. 코스에 포함된 장소와 방문 순서
CREATE TABLE IF NOT EXISTS course_place (
    course_id BIGINT NOT NULL,
    place_id BIGINT NOT NULL,
    visit_order INT NOT NULL,
    PRIMARY KEY (course_id, visit_order),
    CONSTRAINT uq_course_place
        UNIQUE (course_id, place_id),
    CONSTRAINT fk_course_place_course
        FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_place_place
        FOREIGN KEY (place_id) REFERENCES place(id)
);

-- 8. 캘린더에 등록된 코스 일정
CREATE TABLE IF NOT EXISTS calendar_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL UNIQUE,
    room_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    CONSTRAINT fk_calendar_event_course
        FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
    CONSTRAINT fk_calendar_event_room
        FOREIGN KEY (room_id) REFERENCES room(id)
);
