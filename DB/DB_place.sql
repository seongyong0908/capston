// place 테이블 만들기

CREATE TABLE place (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    place_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    visit_order INT NOT NULL,
    description TEXT,
    FOREIGN KEY (course_id) REFERENCES course(id)
);