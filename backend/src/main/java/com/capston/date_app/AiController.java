package com.capston.date_app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class AiController {

    @Autowired
    private AiService aiService;

    @PostMapping("/api/get-course")
    public String getCourse(@RequestBody Map<String, Object> requestData) {
        System.out.println("2. 프론트에서 받은 데이터: " + requestData);
        // 받은 데이터를 그대로 파이썬으로 토스!
        return aiService.getRecommendationFromPython(requestData);
    }
}