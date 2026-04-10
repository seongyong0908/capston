// course 테이블 만들기

CREATE TABLE course (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    total_distance DOUBLE,
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES user(id)
);
