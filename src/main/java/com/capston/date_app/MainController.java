package com.capston.date_app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;

@Controller
public class MainController {

    @Autowired
    private PlaceRepository placeRepository;

    @Value("${google.maps.api.key}")
    private String googleMapsApiKey;

    // 1. 첫 접속 시 메인 화면(index.html)을 보여줍니다.
    @GetMapping("/")
    public String mainPage(Model model) {
        // 메인 화면 리스트에도 장소 정보를 보여주고 싶다면 아래 줄을 추가하세요.
        model.addAttribute("places", placeRepository.findAll());
        return "index"; 
    }

    // 2. /map 주소로 들어오면 지도 화면(map.html)을 보여줍니다.
    @GetMapping("/map")
    public String mapPage(Model model) {
        // DB 데이터와 API 키를 지도 화면으로 전달합니다.
        model.addAttribute("places", placeRepository.findAll());
        model.addAttribute("apiKey", googleMapsApiKey);
        
        return "map";
    }
        // 로그인 길 뚫기
    @GetMapping("/login")
    public String loginPage() {
        return "login"; // "나중에 올 login.html을 보여줄게"라는 예약
    }
        // 로그아웃 동작 (화면 없이 메인으로 리다이렉트)
    @GetMapping("/logout")
    public String logout() {
        // 여기에 나중에 "로그아웃 세션 삭제" 코드를 넣을 거예요.
        // 지금은 일단 로그아웃 하면 바로 첫 화면으로 가게 설정합니다.
        return "redirect:/"; 
    }

    // 회원가입 길 뚫기
    @GetMapping("/signup")
    public String signupPage() {
        return "signup"; // "나중에 올 signup.html을 보여줄게"라는 예약
    }

    // 추천 화면 길 뚫기
    @GetMapping("/recommend")
    public String recommendPage() {
        return "recommend";
    }
// 마이페이지 길 뚫기
    @GetMapping("/mypage")
    public String myPage() {
        return "mypage"; // templates/mypage.html이 생길 예정
    }
}