package com.capston.date_app;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

    // 1. 시작 화면 & 로그인/가입 관련
    @GetMapping("/")
    public String showLoginPage() {
        return "login";
    }

    @GetMapping("/signup")
    public String showSignupPage() {
        return "signup";
    }

    @GetMapping("/forgot-password")
    public String showForgotPasswordPage() {
        return "forgot-password";
    }

    // 2. 취향 설정 관련
    @GetMapping("/taste-setup")
    public String showTasteSetupPage() {
        return "taste-setup";
    }

    @GetMapping("/preferences")
    public String showPreferencesPage() {
        return "preferences";
    }

    // 3. 메인 서비스 & 마이페이지
    @GetMapping("/home")
    public String showHomePage() {
        return "home";
    }

    @GetMapping("/mypage") // 아까 기획하신 '마이페이지로 이동'을 위한 주소!
    public String showMyPage() {
        return "mypage";
    }

    // 4. 지도 및 코스 관련
    @GetMapping("/map")
    public String showMapPage() {
        return "map";
    }

    @GetMapping("/mapview")
    public String showMapViewPage() {
        return "mapview";
    }

    @GetMapping("/multiple-courses")
    public String showMultipleCoursesPage() {
        return "multiple-courses";
    }

    // 5. 캘린더 및 결과 화면
    @GetMapping("/calendar")
    public String showCalendarPage() {
        return "calendar";
    }

    @GetMapping("/result")
    public String showResultPage() {
        return "result";
    }
}