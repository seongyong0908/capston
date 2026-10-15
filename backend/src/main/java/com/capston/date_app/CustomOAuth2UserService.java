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
import java.util.HashMap;
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
        
        Object providerIdValue = attributes.get(userNameAttributeName);
        if (providerIdValue == null) {
            throw new OAuth2AuthenticationException("소셜 로그인 사용자 식별 정보를 찾을 수 없습니다.");
        }
        String providerId = String.valueOf(providerIdValue);
        String email = null;
        String name = null;

        // 카카오 / 구글 제공 정보 추출
        if ("KAKAO".equals(registrationId)) {
            Object accountValue = attributes.get("kakao_account");
            if (accountValue instanceof Map<?, ?> kakaoAccount) {
                email = stringValue(kakaoAccount.get("email"));
                Object profileValue = kakaoAccount.get("profile");
                if (profileValue instanceof Map<?, ?> profile) {
                    name = stringValue(profile.get("nickname"));
                }
            }
        } else if ("GOOGLE".equals(registrationId)) {
            email = stringValue(attributes.get("email"));
            name = stringValue(attributes.get("name"));
        } else {
            throw new OAuth2AuthenticationException("지원하지 않는 소셜 로그인 제공자입니다.");
        }

        String loginId = registrationId + "_" + providerId;

        saveOrUpdateUser(loginId, name, email, registrationId);

        Map<String, Object> principalAttributes = new HashMap<>(attributes);
        principalAttributes.put("loginId", loginId);
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                principalAttributes,
                userNameAttributeName);
    }

    private String stringValue(Object value) {
        return value instanceof String string ? string : null;
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
                    
                    return newUser;
                });

        userRepository.save(user);
    }
}