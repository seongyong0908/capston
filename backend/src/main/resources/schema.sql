

--1. user 테이블
CREATE TABLE user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,      -- [시스템] 고유 식별 번호
    login_id VARCHAR(50) NOT NULL UNIQUE,      -- [회원가입] 아이디
    password VARCHAR(255) NOT NULL,            -- [회원가입] 비밀번호
    name VARCHAR(50) NOT NULL,                 -- [회원가입] 이름
    phone VARCHAR(20) NOT NULL UNIQUE,         -- [회원가입] 휴대폰 번호
    email VARCHAR(100),
    
    -- [취향 설정 화면 데이터]
    like_vibe VARCHAR(255),               -- 선호하는 데이트 분위기 (예: "로맨틱,캐주얼")
    hate_act VARCHAR(255),            -- 선호하지 않는 활동 (예: "카페,쇼핑")
    food_limit VARCHAR(255),         -- 식이 제한사항 (예: "비건,해산물 제외")
    food_memo TEXT                   -- 기타 식이 제한사항 (직접 길게 쓰는 칸)
);

--2. room 테이블 - 방 자체 정보
CREATE TABLE room(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(225),             -- 방 이름
    room_type VARCHAR(50),              -- 방 종류 ( 친구들과 방 또는 연인 방) 나중에 AI가 맞춤형 코스를 짜오게 하는 핵심 힌트
    invite_code VARCHAR(50)             -- 초대 코드
);

--3 room_member 테이블 - 어떤 방에 누가 어떤 권한으로 있는지 - 다대다 관계를 연결해 주는 핵심다리역할
CREATE TABLE room_member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,       -- 고유 식별 번호
    room_id BIGINT,                             -- 몇번방 기록인가
    user_id VARCHAR(255),                       -- 어떤 유저 기록인가
    role VARCHAR(50),                           -- 방장인지 일반 멤버인지 구분
    status VARCHAR(50) DEFAULT 'PENDING'        -- PENDING = 대기중 , ACCEPTED = 승인됨 구분            
);
--4. place 테이블 
CREATE TABLE IF NOT EXISTS place (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    address VARCHAR(255),                       --실제 도로명,지번 주소 
    category VARCHAR(255),                      --장소 종류 유저 취향 분석할 때 중요한 기준됨
    course_id BIGINT,                           --이 장소가 어떤 데이트코스묶음에 속해 있는지
    description TEXT,                           --장소 설명 글
    latitude DECIMAL,                           --위도 y 좌표
    longitude DECIMAL,                          --경도 x 좌표
    opening_hours VARCHAR(255),                 --영업 시간
    place_name VARCHAR(255),                    --장소 실제 이름
    rating DECIMAL,                             --별점
    visit_order INT                             --코스 동선을 순서대로 그릴때 사용(코스 내에서 방문 순서)
);