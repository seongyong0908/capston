package com.capston.date_app;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController; // @Controller 대신 사용
import lombok.RequiredArgsConstructor;
import java.util.Map;

@RestController // 💡 JSON 데이터를 주고받기 위해 RestController로 변경합니다.
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @PostMapping("/signup")
    public String signup(@RequestBody Map<String, String> data) {
        // 🔥 데이터가 잘 넘어왔는지 콘솔에 출력해 확인합니다.
        System.out.println("🔥 회원가입 데이터 도착: " + data);

        User newUser = new User();
        // Map에서 데이터를 키(key) 값으로 쏙쏙 뽑아옵니다.
        newUser.setName(data.get("name"));
        newUser.setLoginId(data.get("login_id"));
        newUser.setPassword(data.get("password"));
        newUser.setPhone(data.get("phone"));
        newUser.setEmail(data.get("email"));

        // DB에 저장
        userRepository.save(newUser);

        // 자바스크립트의 fetch(.then(res => if(res.ok))) 부분에 성공 신호를 보냅니다.
        return "success";
    }
    @PostMapping("/api/taste-setup")
    @ResponseBody // 💡 핵심: 화면 이동이 아니라 글자("success") 데이터만 응답하겠다는 마법의 어노테이션!
    public String tasteSetup(@RequestBody Map<String, String> data) {
        String loginId = data.get("login_id");
        System.out.println("🔥 취향 설정 데이터 도착. 대상 아이디: " + loginId);
        System.out.println("받은 데이터: " + data); // 추가로 어떤 데이터가 왔는지 다 찍어봅니다.

        // 1. DB에서 해당 아이디의 유저를 찾습니다.
        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        // 2. 찾아온 유저 객체에 취향 데이터를 채워 넣습니다.
        user.setLikeVibe(data.get("like_vibe"));
        user.setHateAct(data.get("hate_act"));
        user.setFoodLimit(data.get("food_limit"));
        user.setFoodMemo(data.get("food_memo"));

        // 3. DB에 업데이트
        userRepository.save(user);

        return "success";
    }
}