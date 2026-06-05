package com.capston.date_app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;

@Controller
public class MainController {

    // 기존 구글맵 및 DB 연동 코드 그대로 유지
    @Autowired
    private PlaceRepository placeRepository;

    @Value("${google.maps.api.key}")
    private String googleMapsApiKey;

    // ==========================================
    // 1. 인증 및 초기 진입 화면들
    // ==========================================

    // 앱 처음 켰을 때 나오는 로그인 화면
    @GetMapping("/")
    public String loginPage() {
        return "login"; // templates/login.html
    }

    // 로그인 화면 (경로 지정용)
    @GetMapping("/login.html")
    public String loginPageDirect() {
        return "login";
    }

    // 회원가입 페이지
    @GetMapping("/signup.html")
    public String signupPage() {
        return "signup"; // templates/signup.html
    }

    // 비밀번호 찾기 페이지
    @GetMapping("/forgot-password.html")
    public String forgotPasswordPage() {
        return "forgot-password"; // templates/forgot-password.html
    }

    // 초기 유저용 취향 설정 메인 페이지 (첫 로그인 때 딱 한 번 진입)
    @GetMapping("/taste-setup.html")
    public String tasteSetupPage() {
        return "taste-setup"; // templates/taste-setup.html
    }


    // ==========================================
    // 2. 메인 홈 및 데이트 코스 추천 흐름 (★핵심 시나리오)
    // ==========================================

    // 메인 홈 화면
    @GetMapping("/home.html")
    public String homePage() {
        return "home"; // templates/home.html
    }

    // [추천 흐름 1단계] 홈에서 추천받기 클릭 시 -> 세부 조건 입력 페이지
    @GetMapping("/preferences.html")
    public String preferencesPage() {
        return "preferences"; // templates/preferences.html
    }

    // [추천 흐름 2단계] 조건 입력 후 -> 3가지 코스 후보 중 선택하는 페이지
    @GetMapping("/multiple-courses.html")
    public String multipleCoursesPage() {
        return "multiple-courses"; // templates/multiple-courses.html
    }

    // [추천 흐름 3단계] 코스 중 하나를 최종 선택해서 상세히 보여주는 페이지
    @GetMapping("/result.html")
    public String resultPage() {
        return "result"; // templates/result.html
    }


    // ==========================================
    // 3. 기타 주요 기능 페이지들 (지도, 캘린더, 마이페이지)
    // ==========================================

    // 캘린더 표시 페이지 (일정 관리)
    @GetMapping("/calendar.html")
    public String calendarPage() {
        return "calendar"; // templates/calendar.html
    }

    // 내 지도보기 / 데이트 코스 맵 페이지
    @GetMapping("/map.html")
    public String mapPage() {
        return "map"; // templates/map.html
    }

    // 지도 상세 뷰 페이지
    @GetMapping("/mapview.html")
    public String mapViewPage() {
        return "mapview"; // templates/mapview.html
    }

    // 마이페이지 (방 생성 및 내 정보)
    @GetMapping("/mypage.html")
    public String myPage() {
        return "mypage"; // templates/mypage.html
    }
}