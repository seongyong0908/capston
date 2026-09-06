package com.capston.date_app;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PreferenceRepository preferenceRepository;

    @PostMapping("/signup")
    public String signup(@RequestBody Map<String, String> data) {
        System.out.println("🔥 회원가입 데이터 도착: " + data);

        User newUser = new User();
        newUser.setName(data.get("name"));
        newUser.setLoginId(data.get("login_id"));
        newUser.setPassword(data.get("password"));
        newUser.setPhone(data.get("phone"));
        newUser.setEmail(data.get("email"));

        userRepository.save(newUser);

        return "success";
    }

    @PostMapping("/api/taste-setup")
    @ResponseBody
    public String tasteSetup(@RequestBody Map<String, String> data) {
        String loginId = data.get("login_id");
        System.out.println("🔥 취향 설정 데이터 도착. 대상 아이디: " + loginId);

        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        Preference preference = preferenceRepository.findByUser(user);
        if (preference == null) {
            preference = new Preference();
            preference.setUser(user);
        }

        preference.setLikeVibe(data.get("like_vibe"));
        preference.setHateAct(data.get("hate_act"));
        preference.setFoodLimit(data.get("food_limit"));
        preference.setFoodMemo(data.get("food_memo"));

        preferenceRepository.save(preference);

        return "success";
    }

    @PostMapping("/api/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> data) {
        String loginId = data.get("login_id");
        String password = data.get("password");

        System.out.println("🔥 로그인 시도 아이디: " + loginId);


        User user = userRepository.findByLoginId(loginId).orElse(null);

        if (user == null || !user.getPassword().equals(password)) {
            return ResponseEntity.status(401).body("아이디 또는 비밀번호가 틀렸습니다.");
        }

        return ResponseEntity.ok("success");
    }

    @GetMapping("/api/user")
    public User getUserInfo(@RequestParam("login_id") String loginId) {
        System.out.println("🔥 마이페이지 정보 요청 들어온 아이디: " + loginId);
        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        return user;
    }

    @PutMapping("/api/user")
    public String updateUserInfo(@RequestParam("login_id") String loginId, @RequestBody Map<String, String> data) {
        System.out.println("🔥 프로필 수정 요청 들어온 아이디: " + loginId);

        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        
        user.setName(data.get("name"));
        user.setEmail(data.get("email"));
        user.setPhone(data.get("phone"));
        
        userRepository.save(user);
        return "success";
    }
}