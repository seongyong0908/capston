package com.capston.date_app;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter @Setter
public class RoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; 

    private Long roomId; // 어떤 방인지 번호 저장
    private String userId; // 누구인지 아이디 저장 (ksy0908 등)
    private String role; // 방장(HOST)인지 멤버(MEMBER)인지
}