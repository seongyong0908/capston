package com.capston.date_app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

    @Autowired
    private PlaceRepository placeRepository;

    // properties 파일에서 구글 맵 키 값을 읽어옵니다.
    @Value("${google.maps.api.key}")
    private String googleMapsApiKey;

    @GetMapping("/")
    public String index(Model model) {
        // 1. DB에서 맛집(Place) 리스트 가져와서 보내기
        model.addAttribute("places", placeRepository.findAll());
        
        // 2. HTML에 구글 맵 API 키 전달하기
        model.addAttribute("apiKey", googleMapsApiKey);
        
        return "index";
    }
}