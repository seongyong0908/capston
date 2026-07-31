package com.capston.date_app;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // 💡 login_id로 유저를 찾는 마법의 메서드
    Optional<User> findByLoginId(String loginId);
}