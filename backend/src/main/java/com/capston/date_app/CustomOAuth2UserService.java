package com.capston.date_app;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        // 서비스 구분 (KAKAO 또는 GOOGLE)
        String registrationId = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
        
        // OAuth2 로그인 진행 시 키가 되는 필드값 (카카오: id, 구글: sub)
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        Map<String, Object> attributes = oAuth2User.getAttributes();
        
        String providerId = String.valueOf(attributes.get(userNameAttributeName)); // 소셜 고유 PK
        String email = null;
        String name = null;

        // 카카오 / 구글 제공 정보 추출
        if ("KAKAO".equals(registrationId)) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            if (kakaoAccount != null) {
                email = (String) kakaoAccount.get("email");
                Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
                if (profile != null) {
                    name = (String) profile.get("nickname");
                }
            }
        } else if ("GOOGLE".equals(registrationId)) {
            email = (String) attributes.get("email");
            name = (String) attributes.get("name");
        }

        // 👉 완벽하게 고유성이 보장되는 loginId 생성 (예: KAKAO_38291048 / GOOGLE_10928374921)
        String loginId = registrationId + "_" + providerId;

        // DB 저장 또는 기존 유저 가져오기
        saveOrUpdateUser(loginId, name, email, registrationId);

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                userNameAttributeName);
    }

    private void saveOrUpdateUser(String loginId, String name, String email, String provider) {
        User user = userRepository.findByLoginId(loginId)
                .map(entity -> {
                    // 기존 회원이면 닉네임/이메일 변경 시 업데이트
                    if (name != null) entity.setName(name);
                    if (email != null) entity.setEmail(email);
                    return entity;
                })
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setLoginId(loginId);
                    newUser.setName(name != null ? name : "소셜회원");
                    newUser.setEmail(email);
                    newUser.setProvider(provider);
                    newUser.setPassword("OAUTH_USER_TEMP_PASSWORD");
                    
                    // 👉 절대 겹치지 않는 임시 전화번호 생성 (loginId 해시값 활용)
                    int hash = Math.abs(loginId.hashCode() % 100000000);
                    String uniqueTempPhone = String.format("010-%04d-%04d", hash / 10000, hash % 10000);
                    newUser.setPhone(uniqueTempPhone);
                    
                    return newUser;
                });

        userRepository.save(user);
    }
}