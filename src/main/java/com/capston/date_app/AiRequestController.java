// AI 추천 요청 저장/조회 API 처리 (/api/ai-request)

package com.capston.date_app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AiRequestController {

    @Autowired
    private AiRequestRepository aiRequestRepository;

    // AI 요청 저장
    @PostMapping("/ai-request")
    public String saveAiRequest(@RequestBody AiRequest aiRequest) {
        aiRequestRepository.save(aiRequest);
        return "AI 요청 저장 성공!";
    }

    // AI 요청 전체 조회
    @GetMapping("/ai-request")
    public List<AiRequest> getAllAiRequests() {
        return aiRequestRepository.findAll();
    }

    // 특정 AI 요청 조회
    @GetMapping("/ai-request/{id}")
    public AiRequest getAiRequest(@PathVariable Long id) {
        return aiRequestRepository.findById(id).orElse(null);
    }
}