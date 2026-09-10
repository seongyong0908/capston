package com.capston.date_app;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PreferenceRepository extends JpaRepository<Preference, Long> {
    // 나중에 특정 유저의 취향을 찾을 때 쓸 수 있는 메서드도 여기에 추가할 수 있습니다.
    Preference findByUser(User user);
}