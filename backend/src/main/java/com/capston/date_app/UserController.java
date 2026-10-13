package com.capston.date_app;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;


import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PreferenceRepository preferenceRepository;
    private final JavaMailSender javaMailSender; // 💡 메일 전송을 위한 JavaMailSender 주입

    public record UserProfileResponse(
            String loginId,
            String name,
            String email,
            String phone,
            String likeVibe,
            String hateAct,
            String foodLimit,
            String foodMemo) {
    }

    @PostMapping("/signup")
    public String signup(@RequestBody Map<String, String> data) {
        System.out.println("🔥 회원가입 데이터 도착: " + data);

        User newUser = new User();
        newUser.setName(data.get("name"));
        newUser.setLoginId(data.get("login_id"));
        newUser.setPassword(data.get("password"));
        newUser.setPhone(data.get("phone"));
        newUser.setEmail(data.get("email"));

        // 💡 일반 회원가입 유저임을 명시
        newUser.setProvider("LOCAL");

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
    public ResponseEntity<?> login(@RequestBody Map<String, String> data, HttpServletRequest request) {
        String loginId = data.get("login_id");
        String password = data.get("password");

        System.out.println("🔥 로그인 시도 아이디: " + loginId);

        User user = userRepository.findByLoginId(loginId).orElse(null);

        // 💡 소셜 가입 유저는 password가 null이므로 NullPointerException 발생 방지를 위해 조건 유지
        if (user == null || user.getPassword() == null || !user.getPassword().equals(password)) {
            return ResponseEntity.status(401).body("아이디 또는 비밀번호가 틀렸습니다.");
        }

        // 💡 [핵심 해결 방법] Spring Security 세션에 인증 정보 수동 등록
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(
                        user.getLoginId(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                );

        SecurityContext securityContext = SecurityContextHolder.getContext();
        securityContext.setAuthentication(authenticationToken);

        // HTTP 세션에 SecurityContext 저장
        HttpSession session = request.getSession(true);
        session.setAttribute("SPRING_SECURITY_CONTEXT", securityContext);

        System.out.println("🔥 로그인 성공 및 세션 등록 완료: " + user.getLoginId());

        return ResponseEntity.ok("success");
    }

    // 💡 비밀번호 찾기 (이메일로 재설정 링크 전송) API
    @PostMapping("/api/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> data) {
        String email = data.get("email");
        System.out.println("🔥 비밀번호 재설정 요청 이메일: " + email);

        // 1. DB에서 해당 이메일을 가진 유저가 있는지 확인
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("가입되지 않은 이메일입니다.");
        }

        // 2. 재설정 링크 생성 (로컬 테스트용 주소)
        String resetLink = "http://localhost:8080/reset-password?email=" + email;

        try {
            // 3. 메일 내용 작성 및 전송
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email); // 받는 사람 이메일
            message.setSubject("[데이트코스 추천] 비밀번호 재설정 안내 메일입니다."); // 메일 제목
            message.setText("안녕하세요, " + user.getName() + "님!\n\n" +
                    "요청하신 비밀번호 재설정 링크입니다. 아래 링크를 눌러 비밀번호를 변경해 주세요.\n\n" +
                    resetLink + "\n\n감사합니다."); // 메일 본문

            javaMailSender.send(message);
            System.out.println("🔥 비밀번호 재설정 메일 발송 성공!");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("메일 전송 중 오류가 발생했습니다.");
        }

        return ResponseEntity.ok("success");
    }

    @GetMapping("/api/user")
    public UserProfileResponse getUserInfo(@RequestParam("login_id") String loginId) {
        System.out.println("🔥 마이페이지 정보 요청 들어온 아이디: " + loginId);
        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        Preference preference = preferenceRepository.findByUser(user);

        return new UserProfileResponse(
                user.getLoginId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                preference == null ? null : preference.getLikeVibe(),
                preference == null ? null : preference.getHateAct(),
                preference == null ? null : preference.getFoodLimit(),
                preference == null ? null : preference.getFoodMemo());
        }
    public static class UserProfileDto {
        public String loginId;
        public String name;

        public UserProfileDto(User user) {
            this.loginId = user.getLoginId();
            this.name = user.getName();
        }
    }

    // 💡 마이페이지 유저 정보 조회 (보안 세션 우선 조회 방식)
    @GetMapping("/api/user")
    public ResponseEntity<?> getUserInfo(
            Authentication authentication,
            @RequestParam(value = "login_id", required = false) String paramLoginId) {

        String loginId = null;

        // 1. Spring Security 인증 객체(Authentication)에서 로그인한 유저 ID 추출
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {

            if (authentication.getPrincipal() instanceof OAuth2User) {
                // 카카오 / 구글 소셜 로그인
                OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                Map<String, Object> attributes = oAuth2User.getAttributes();

                if (attributes.containsKey("loginId")) {
                    loginId = (String) attributes.get("loginId");
                } else {
                    loginId = "KAKAO_" + oAuth2User.getName();
                }
            } else {
                // 일반 로그인 (Spring Security)
                loginId = authentication.getName();
            }
        }

        // 2. 인증 객체 세션이 없는 경우, 전달된 파라미터 login_id 사용 (Fallback)
        if (loginId == null || loginId.isEmpty()) {
            loginId = paramLoginId;
        }

        // 3. 최종적으로도 loginId가 없으면 401 에러
        if (loginId == null || loginId.isEmpty()) {
            return ResponseEntity.status(401).body("로그인 정보가 유효하지 않습니다.");
        }

        System.out.println("🔥 마이페이지 정보 요청 들어온 아이디: " + loginId);

        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        return ResponseEntity.ok(new UserProfileDto(user));
    }

    // 💡 프로필 수정 API
    @PutMapping("/api/user")
    public String updateUserInfo(
            Authentication authentication,
            @RequestParam(value = "login_id", required = false) String paramLoginId,
            @RequestBody Map<String, String> data) {

        String loginId = null;

        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            if (authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                Map<String, Object> attributes = oAuth2User.getAttributes();
                loginId = attributes.containsKey("loginId") ? (String) attributes.get("loginId") : "KAKAO_" + oAuth2User.getName();
            } else {
                loginId = authentication.getName();
            }
        }

        if (loginId == null || loginId.isEmpty()) {
            loginId = paramLoginId;
        }

        System.out.println("🔥 프로필 수정 요청 들어온 아이디: " + loginId);

        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        if (data.containsKey("name")) user.setName(data.get("name"));
        if (data.containsKey("email")) user.setEmail(data.get("email"));
        if (data.containsKey("phone")) user.setPhone(data.get("phone"));

        userRepository.save(user);
        return "success";
    }

    // 💡 새 비밀번호 재설정(변경) API
    @PostMapping("/api/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> data) {
        String email = data.get("email");
        String newPassword = data.get("newPassword");

        System.out.println("🔥 비밀번호 재설정 요청 이메일: " + email);

        if (email == null || newPassword == null) {
            return ResponseEntity.badRequest().body("잘못된 요청입니다.");
        }

        // 1. 해당 이메일을 가진 유저 조회
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("존재하지 않는 회원입니다.");
        }

        // 2. 새 비밀번호로 업데이트
        user.setPassword(newPassword);
        userRepository.save(user);

        System.out.println("🔥 비밀번호 재설정 완료!");
        return ResponseEntity.ok("success");
    }

}