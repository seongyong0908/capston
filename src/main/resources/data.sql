-- 테이블 안에 데이터들을 넣는 파일

-- 유저 데이터 (ID 1번으로 고정해서 삽입)
INSERT IGNORE INTO user (id, email, password, nickname) 
VALUES (1, 'test@test.com', '1234', '성용테스터');

-- 코스 데이터 (유저 1번에 연결)
INSERT IGNORE INTO course (id, user_id, title, total_distance) 
VALUES (1, 1, '서일대 데이트 코스', 1.0);

-- 장소 데이터 (코스 1번에 연결 / 서일대학교 좌표)
INSERT IGNORE INTO place (id, course_id, place_name, latitude, longitude, visit_order, description)
VALUES (1, 1, '서일대학교', 37.5861, 127.0970, 1, '캡스톤 자동화 테스트 데이터');