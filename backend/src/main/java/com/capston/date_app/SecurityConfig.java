package com.capston.date_app;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. CSRF 비활성화 (REST API / Fetch 통신 사용 시)
            .csrf(csrf -> csrf.disable())
            
            // 2. HTTP 요청 접근 권한 설정
            .authorizeHttpRequests(auth -> auth
                // 누구나 접근 가능한 경로 등록
                .requestMatchers(
                    "/", "/home", "/login", "/signup", 
                    "/forgot-password", "/reset-password",
                    "/api/**", 
                    "/css/**", "/js/**", "/images/**", "/favicon.ico", "*.css", "*.js"
                ).permitAll()
                // 그 외 모든 요청은 인증 필요
                .anyRequest().authenticated()
            )

            // 3. 커스텀 로그인 페이지 지정
            .formLogin(form -> form
                .loginPage("/login")
                .permitAll()
            )

            // 4. OAuth2 소셜 로그인 지정
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
                .defaultSuccessUrl("/home", true)
            );

        return http.build();
    }
}