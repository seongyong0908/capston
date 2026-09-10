package com.capston.date_app;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID; // 💡 무작위 코드(UUID) 생성을 위해 추가!

import java.util.List;
import java.util.Optional;

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
        roomMember.setStatus("ACCEPTED");
        roomMemberRepository.save(roomMember);

        System.out.println("🔥 방 생성 완료! 방 이름: " + roomName + " | 초대 코드: " + inviteCode);
        return ResponseEntity.ok("success");
    }
   // 💡 1. 내가 속한 방 목록 가져오기 API (수정됨)
    @GetMapping("/api/rooms")
    public ResponseEntity<?> getMyRooms(@RequestParam("login_id") String loginId) {
        // 내가 멤버로 들어가 있는 방 찾기
        List<RoomMember> members = roomMemberRepository.findByUserId(loginId);
        List<Map<String, Object>> responseList = new ArrayList<>();

        for (RoomMember member : members) {
            Optional<Room> roomOpt = roomRepository.findById(member.getRoomId());
            if (roomOpt.isPresent()) {
                Room room = roomOpt.get();
                Map<String, Object> roomData = new HashMap<>();
                
                // 프론트엔드가 필요한 방 기본 정보 담기
                roomData.put("id", room.getId());
                roomData.put("roomName", room.getRoomName());
                roomData.put("roomType", room.getRoomType());
                roomData.put("inviteCode", room.getInviteCode());
                roomData.put("memberStatus", member.getStatus()); // ⏳ 대기중 뱃지를 위한 상태값!

                // 👑 이 방의 방장(HOST) 아이디 찾아서 넣기
                String adminId = "";
                List<RoomMember> allMembersInRoom = roomMemberRepository.findByRoomId(room.getId());
                for (RoomMember rm : allMembersInRoom) {
                    if ("HOST".equals(rm.getRole())) {
                        adminId = rm.getUserId();
                        break;
                    }
                }
                roomData.put("adminId", adminId); // 자바스크립트가 애타게 찾던 그 이름표!

                responseList.add(roomData);
            }
        }
        return ResponseEntity.ok(responseList);
    }

    // 💡 3. 방 삭제 API (방장 전용)
    @DeleteMapping("/api/rooms/{roomId}")
    public ResponseEntity<?> deleteRoom(@PathVariable Long roomId) {
        try {
            // 1. 해당 방(Room) 데이터 삭제
            roomRepository.deleteById(roomId);
            
            // 2. 이 방에 묶여있던 모든 멤버 통행증(RoomMember)도 싹 다 삭제
            List<RoomMember> membersInRoom = roomMemberRepository.findByRoomId(roomId);
            roomMemberRepository.deleteAll(membersInRoom);
            
            return ResponseEntity.ok("success");
            
        } catch (Exception e) {
            System.out.println("방 삭제 중 에러 발생: " + e.getMessage());
            return ResponseEntity.status(500).body("방 삭제 실패");
        }
    }

    // 💡 5. 멤버 승인 API
    @PutMapping("/api/rooms/{roomId}/members/{userId}/approve")
    public ResponseEntity<?> approveMember(@PathVariable Long roomId, @PathVariable String userId) {
        // 이 방에 있는 해당 유저의 통행증을 찾음
        List<RoomMember> members = roomMemberRepository.findByRoomId(roomId);
        for (RoomMember member : members) {
            if (member.getUserId().equals(userId)) {
                member.setStatus("ACCEPTED"); // 상태를 승인됨으로 변경!
                roomMemberRepository.save(member);
                return ResponseEntity.ok("승인 완료");
            }
        }
        return ResponseEntity.status(404).body("멤버를 찾을 수 없습니다.");
    }

    // 💡 6. 멤버 거절/추방 API (거절하면 DB에서 통행증을 찢어버림)
    @DeleteMapping("/api/rooms/{roomId}/members/{userId}/reject")
    public ResponseEntity<?> rejectMember(@PathVariable Long roomId, @PathVariable String userId) {
        List<RoomMember> members = roomMemberRepository.findByRoomId(roomId);
        for (RoomMember member : members) {
            if (member.getUserId().equals(userId)) {
                roomMemberRepository.delete(member); // DB에서 아예 삭제
                return ResponseEntity.ok("추방 완료");
            }
        }
        return ResponseEntity.status(404).body("멤버를 찾을 수 없습니다.");
    }

    // 💡 2. 방 나가기 API (일반 멤버용)
    @PostMapping("/api/rooms/{roomId}/leave")
    public ResponseEntity<?> leaveRoom(@PathVariable Long roomId, @RequestParam("login_id") String loginId) {
        
        // 내 아이디로 등록된 멤버 기록들을 다 불러옴
        List<RoomMember> myMembers = roomMemberRepository.findByUserId(loginId);
        
        // 그 중에서 지금 나가려고 하는 방(roomId)의 기록만 찾아서 삭제!
        for (RoomMember member : myMembers) {
            if (member.getRoomId().equals(roomId)) {
                roomMemberRepository.delete(member);
                return ResponseEntity.ok("success");
            }
        }
        
        return ResponseEntity.status(400).body("해당 방의 멤버가 아닙니다.");
    }

    // 💡 4. 방 멤버 목록 불러오기 API (멤버 관리 모달창용)
    @GetMapping("/api/rooms/{roomId}/members")
    public ResponseEntity<?> getRoomMembers(@PathVariable Long roomId) {
        try {
            // 이 방 번호(roomId)를 가지고 있는 모든 멤버들의 통행증(RoomMember)을 다 찾아서 가져옴
            List<RoomMember> membersInRoom = roomMemberRepository.findByRoomId(roomId);
            
            // 프론트엔드(자바스크립트)로 목록을 예쁘게 던져줌!
            return ResponseEntity.ok(membersInRoom);
            
        } catch (Exception e) {
            System.out.println("멤버 목록 불러오기 중 에러 발생: " + e.getMessage());
            return ResponseEntity.status(500).body("멤버 목록을 불러오는데 실패했습니다.");
        }
    }
    // 💡 7. 초대코드로 방 참여(대기) 요청 API
    @PostMapping("/api/rooms/join")
    public ResponseEntity<?> joinRoom(@RequestBody Map<String, String> data) {
        String loginId = data.get("login_id");
        String inviteCode = data.get("invite_code");

        // 1. 넘어온 초대코드로 방이 실제로 존재하는지 찾기
        Optional<Room> roomOpt = roomRepository.findByInviteCode(inviteCode);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body("초대 코드가 올바르지 않거나 존재하지 않는 방입니다.");
        }
        Room room = roomOpt.get();

        // 2. 이미 가입했거나 대기 중인지 중복 검사 (옵션)
        List<RoomMember> existingMembers = roomMemberRepository.findByRoomId(room.getId());
        for (RoomMember rm : existingMembers) {
            if (rm.getUserId().equals(loginId)) {
                return ResponseEntity.status(400).body("이미 참여 중이거나 승인 대기 중인 방입니다.");
            }
        }

        // 3. 통행증(RoomMember) 발급! 단, 상태는 대기중(PENDING)으로!
        RoomMember newMember = new RoomMember();
        newMember.setUserId(loginId);
        newMember.setRoomId(room.getId());
        newMember.setRole("MEMBER"); // 방장이 아니니까 일반 멤버
        newMember.setStatus("PENDING"); // ⏳ 제일 중요한 부분: 대기 상태로 저장!

        roomMemberRepository.save(newMember);

        return ResponseEntity.ok("참여 요청 완료! 방장의 승인을 기다려주세요.");
    }
}