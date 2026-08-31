package com.capston.date_app;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
public class AiController {

    @Autowired
    private AiService aiService;

    // 프론트엔드(home.js)에서 이 주소로 요청을 보내게 됩니다.
    @PostMapping("/api/get-course")
    public String getCourse() {
        // 배달부 출발! -> 파이썬 서버 다녀오기
        return aiService.getRecommendationFromPython();
    }
}