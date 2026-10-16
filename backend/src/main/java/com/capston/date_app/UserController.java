package com.capston.date_app;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    private static final int RESET_TOKEN_VALID_MINUTES = 15;

    private final UserRepository userRepository;
    private final PreferenceRepository preferenceRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final PasswordEncoder passwordEncoder;

    public record UserProfileResponse(
            String name,
            String email,
            String phone,
            String likeVibe,
            String hateAct,
            String foodLimit,
            String foodMemo) {
    }

    public record LoginSessionResponse(String loginId, boolean needsTasteSetup) {
    }

    @PostMapping("/signup")
    public String signup(@RequestBody Map<String, String> data) {
        User newUser = new User();
        newUser.setName(data.get("name"));
        newUser.setLoginId(data.get("login_id"));
        String password = data.get("password");
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("비밀번호는 8자 이상이어야 합니다.");
        }
        newUser.setPassword(passwordEncoder.encode(password));
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

        User user = userRepository.findByLoginId(loginId).orElse(null);

        if (user == null || user.getPassword() == null || password == null
                || !passwordMatchesAndUpgrade(user, password)) {
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

        return ResponseEntity.ok("success");
    }

    @PostMapping("/api/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> data) {
        String email = data.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("이메일을 입력해주세요.");
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            return ResponseEntity.internalServerError().body("메일 발송 설정이 없어 비밀번호 재설정을 사용할 수 없습니다.");
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.ok("등록된 이메일이라면 재설정 안내를 발송했습니다.");
        }

        String tokenValue = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(
                tokenValue, user, LocalDateTime.now().plusMinutes(RESET_TOKEN_VALID_MINUTES));
        passwordResetTokenRepository.deleteAllByUser(user);
        passwordResetTokenRepository.save(resetToken);

        String resetLink = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/reset-password")
                .queryParam("token", tokenValue)
                .build()
                .toUriString();
        try {
            MimeMessageHelper message = new MimeMessageHelper(
                    mailSender.createMimeMessage(), true, StandardCharsets.UTF_8.name());
            message.setTo(email);
            message.setSubject("[데이트코스 추천] 비밀번호 재설정 안내 메일입니다.");
            String plainText = "안녕하세요, " + user.getName() + "님!\n\n" +
                    "아래 주소를 열어 비밀번호를 변경해 주세요.\n\n" +
                    resetLink + "\n\n이 링크는 " + RESET_TOKEN_VALID_MINUTES + "분 후 만료됩니다.\n\n감사합니다.";
            String htmlText = "<p>안녕하세요, " + HtmlUtils.htmlEscape(user.getName()) + "님!</p>" +
                    "<p>아래 버튼을 눌러 비밀번호를 변경해 주세요.</p>" +
                    "<p><a href=\"" + HtmlUtils.htmlEscape(resetLink) + "\">비밀번호 재설정하기</a></p>" +
                    "<p>이 링크는 " + RESET_TOKEN_VALID_MINUTES + "분 후 만료됩니다.</p>";
            message.setText(plainText, htmlText);
            mailSender.send(message.getMimeMessage());
        } catch (MailException | MessagingException e) {
            passwordResetTokenRepository.delete(resetToken);
            logger.error("Password reset email could not be sent", e);
            return ResponseEntity.status(500).body("메일 전송 중 오류가 발생했습니다.");
        }

        return ResponseEntity.ok("등록된 이메일이라면 재설정 안내를 발송했습니다.");
    }

    @GetMapping("/api/user")
    public ResponseEntity<?> getUserInfo(
            Authentication authentication,
            @RequestParam(value = "login_id", required = false) String paramLoginId) {

        String loginId;
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            if (authentication.getPrincipal() instanceof OAuth2User oauth2User) {
                loginId = (String) oauth2User.getAttributes().get("loginId");
            } else {
                loginId = authentication.getName();
            }
        } else {
            loginId = paramLoginId;
        }

        if (loginId == null || loginId.isEmpty()) {
            return ResponseEntity.status(401).body("로그인 정보가 유효하지 않습니다.");
        }

        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        Preference preference = preferenceRepository.findByUser(user);

        return ResponseEntity.ok(new UserProfileResponse(
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                preference == null ? null : preference.getLikeVibe(),
                preference == null ? null : preference.getHateAct(),
                preference == null ? null : preference.getFoodLimit(),
                preference == null ? null : preference.getFoodMemo()));
    }

    @GetMapping("/api/session")
    public ResponseEntity<?> getLoginSession(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof OAuth2User oauth2User)) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        Object loginIdValue = oauth2User.getAttributes().get("loginId");
        if (!(loginIdValue instanceof String loginId) || loginId.isBlank()) {
            return ResponseEntity.status(401).body("로그인 정보를 확인할 수 없습니다.");
        }

        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalStateException("소셜 로그인 사용자 정보를 찾을 수 없습니다."));
        Preference preference = preferenceRepository.findByUser(user);
        boolean needsTasteSetup = preference == null
                || preference.getLikeVibe() == null
                || preference.getLikeVibe().isBlank();

        return ResponseEntity.ok(new LoginSessionResponse(loginId, needsTasteSetup));
    }

    // 💡 프로필 수정 API
    @PutMapping("/api/user")
    public String updateUserInfo(
            Authentication authentication,
            @RequestParam(value = "login_id", required = false) String paramLoginId,
            @RequestBody Map<String, String> data) {

        String loginId;
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            if (authentication.getPrincipal() instanceof OAuth2User oauth2User) {
                loginId = (String) oauth2User.getAttributes().get("loginId");
            } else {
                loginId = authentication.getName();
            }
        } else {
            loginId = paramLoginId;
        }

        if (loginId == null || loginId.isEmpty()) {
            return "로그인 정보가 유효하지 않습니다.";
        }

        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        if (data.containsKey("name")) user.setName(data.get("name"));
        if (data.containsKey("email")) user.setEmail(data.get("email"));
        if (data.containsKey("phone")) user.setPhone(data.get("phone"));

        userRepository.save(user);
        return "success";
    }

    @PostMapping("/api/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> data) {
        String tokenValue = data.get("token");
        String newPassword = data.get("newPassword");

        if (tokenValue == null || tokenValue.isBlank() || newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().body("잘못된 요청입니다.");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(tokenValue).orElse(null);
        if (resetToken == null || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            if (resetToken != null) {
                passwordResetTokenRepository.delete(resetToken);
            }
            return ResponseEntity.badRequest().body("재설정 링크가 만료되었거나 유효하지 않습니다.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        passwordResetTokenRepository.deleteAllByUser(user);
        return ResponseEntity.ok("success");
    }

    private boolean passwordMatchesAndUpgrade(User user, String rawPassword) {
        String storedPassword = user.getPassword();
        if (isBcryptHash(storedPassword)) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }
        if (!storedPassword.equals(rawPassword)) {
            return false;
        }

        user.setPassword(passwordEncoder.encode(rawPassword));
        userRepository.save(user);
        return true;
    }

    private boolean isBcryptHash(String password) {
        return password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$");
    }
}