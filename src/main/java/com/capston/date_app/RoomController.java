package com.capston.date_app;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.Map;
import java.util.UUID; // 💡 무작위 코드(UUID) 생성을 위해 추가!

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RoomController {
    
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;

    // 💡 방 생성 API
    @PostMapping("/api/rooms")
    public ResponseEntity<?> createRoom(@RequestBody Map<String, String> data) {
        String loginId = data.get("login_id");
        String roomName = data.get("room_name");
        String roomType = data.get("room_type");

        // 1. 방을 만드는 유저(방장) 찾기
        User user = userRepository.findByLoginId(loginId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(400).body("로그인 정보가 유효하지 않습니다.");
        }

        // 💡 2. 무작위 초대 코드 6자리 생성 (예: A7X9Q2)
        String inviteCode = UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        // 3. Room(방) 생성 및 저장
        Room room = new Room();
        room.setRoomName(roomName); // ⚠️ Room.java 변수명에 맞게 setRoomName으로 변경!
        room.setRoomType(roomType); // ⚠️ Room.java 변수명에 맞게 setRoomType으로 변경!
        room.setInviteCode(inviteCode); // 💡 생성된 초대 코드 넣기!
        roomRepository.save(room);

        // 4. RoomMember(방 멤버) 생성 및 저장 (방장 권한 부여)
        RoomMember roomMember = new RoomMember();
        roomMember.setUserId(loginId); 
        roomMember.setRoomId(room.getId()); 
        roomMember.setRole("HOST"); // 방을 만든 사람이니까 HOST(방장)!
        roomMemberRepository.save(roomMember);

        System.out.println("🔥 방 생성 완료! 방 이름: " + roomName + " | 초대 코드: " + inviteCode);
        return ResponseEntity.ok("success");
    }
    // 💡 내가 속한 방 목록 가져오기 API
    @GetMapping("/api/rooms")
    public ResponseEntity<?> getMyRooms(@RequestParam("login_id") String loginId) {
        // 내가 멤버로 들어가 있는 방 번호들 찾기
        List<RoomMember> members = roomMemberRepository.findByUserId(loginId);
        List<Room> myRooms = new ArrayList<>();

        for (RoomMember member : members) {
            roomRepository.findById(member.getRoomId()).ifPresent(myRooms::add);
        }

        return ResponseEntity.ok(myRooms);
    }
}