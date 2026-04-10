package com.capston.date_app;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Long> {
    // DB에서 데이터를 가져오는 마법의 지팡이입니다.
}