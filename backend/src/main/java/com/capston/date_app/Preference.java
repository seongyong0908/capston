package com.capston.date_app;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "preference")
@Getter
@Setter
public class Preference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "preference_id")
    private Long id;

    // 어떤 유저의 취향인지 연결 (1대1 관계)
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    // 유저가 가졌던 취향 정보들 이사 완료!
    private String likeVibe;
    private String hateAct;
    private String foodLimit;
    
    @Column(columnDefinition = "TEXT")
    private String foodMemo;
}