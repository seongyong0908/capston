package com.capston.date_app;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.Map;

@Service
public class AiService {

    public String getRecommendationFromPython(Map<String, Object> requestData) {
        RestTemplate restTemplate = new RestTemplate();
        String pythonUrl = "http://127.0.0.1:8000/api/recommend"; 

        // 파이썬에게 "이거 JSON 데이터야!" 라고 알려주는 헤더
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 헤더와 데이터를 예쁘게 포장
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestData, headers);

        // 파이썬으로 전송 후 결과 받아오기
        ResponseEntity<String> response = restTemplate.postForEntity(pythonUrl, entity, String.class);
        
        return response.getBody(); 
    }
}