package com.capston.date_app;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller; // RestController가 아니어야 합니다!
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {
    @Value("${google.maps.api.key}")
    private String apiKey;

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("apiKey", apiKey);
        return "index";
    }
}