package com.capston.date_app;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MainController {

    @GetMapping("/")
    public String home() {
        return "드디어 서버 연결 성공! 캡스톤 디자인 시작합니다. 🚀";
    }
}