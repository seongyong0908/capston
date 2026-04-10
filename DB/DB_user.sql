//user 테이블 만들기

USE datecourse;

CREATE TABLE user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    disliked_foods TEXT,
    preferred_style VARCHAR(100)
);
