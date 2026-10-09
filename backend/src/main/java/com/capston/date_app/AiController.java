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

 // 🚨 핵심 수정: produces = "application/json;charset=UTF-8" 추가 (이거 JSON이니까 똑바로 보내! 라는 뜻)
    @PostMapping(value = "/api/get-course", produces = "application/json;charset=UTF-8")
    public String getCourse(@RequestBody Map<String, Object> requestData) {
        System.out.println("2. 프론트에서 받은 데이터: " + requestData);
        
        // 파이썬에서 온 응답을 일단 변수에 담기
        String pythonResponse = aiService.getRecommendationFromPython(requestData);
        
        // 🚨 범인 잡기 CCTV: 파이썬이 빈껍데기를 줬는지 자바 터미널에 출력해보기
        System.out.println("3. 파이썬이 자바에게 준 응답: " + pythonResponse); 
        
        return pythonResponse;
    }

    @PostMapping(value = "/api/get-alternatives", produces = "application/json;charset=UTF-8")
    public String getAlternatives(@RequestBody Map<String, Object> requestData) {
        return aiService.getRankedAlternativesFromPython(requestData);
    }

}