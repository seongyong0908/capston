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

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String phone;

    private String email;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Preference preference;
}