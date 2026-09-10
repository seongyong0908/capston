package com.capston.date_app;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter @Setter
public class Room {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; 

    private String roomName; // 방 이름
    private String roomType; // 방 종류 (연인/친구)
    private String inviteCode; // 초대 코드
}