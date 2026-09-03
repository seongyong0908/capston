package com.capston.date_app;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    // 💡 나중에 특정 방(roomId)에 있는 사람들을 한 번에 싹 불러올 때 쓸 마법의 코드
    List<RoomMember> findByRoomId(Long roomId);
    List<RoomMember> findByUserId(String userId);
}