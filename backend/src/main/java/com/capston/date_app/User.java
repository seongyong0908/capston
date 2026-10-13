package com.capston.date_app; 

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 시스템 고유 번호

    @Column(name = "login_id", nullable = false, unique = true)
    private String loginId; 

    // 소셜 로그인은 비밀번호가 없으므로 null 허용
    @Column(nullable = true)
    private String password;

    @Column(nullable = false)
    private String name;

    // 소셜 로그인은 전화번호가 선택 항목일 수 있으므로 null 허용 및 unique 해제
    @Column(nullable = true)
    private String phone;

    private String email;

    // 가입 수단 구분 ("LOCAL", "KAKAO", "GOOGLE")
    private String provider;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Preference preference;
}