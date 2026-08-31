package com.capston.date_app;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    // 파이썬 서버로 데이터를 쏴주고 결과를 받아오는 함수입니다.
    public String getRecommendationFromPython() {
        RestTemplate restTemplate = new RestTemplate();
        // 아까 켜둔 파이썬 서버의 주소!
        String pythonUrl = "http://127.0.0.1:8000/api/recommend"; 

        // 1. 파이썬으로 보낼 가짜 데이터 포장하기 (취향, 후보 장소)
        Map<String, Object> requestData = new HashMap<>();
        requestData.put("tastes", List.of("조용한", "매운맛")); // 가짜 취향
        requestData.put("places", List.of(
            Map.of("id", 1, "name", "A카페"),
            Map.of("id", 2, "name", "B식당")
        )); // 가짜 장소 리스트

        // 2. 파이썬 서버로 POST 요청 쏘기!
        ResponseEntity<String> response = restTemplate.postForEntity(pythonUrl, requestData, String.class);
        
        // 3. 파이썬이 대답한 결과(가짜 코스 3개)를 그대로 반환
        return response.getBody(); 
    }
}