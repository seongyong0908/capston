package com.capston.date_app;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PlaceRepository extends JpaRepository<Place, Long> {

    // 예전 버전: 순수 거리순 LIMIT 10 이라 식당/카페가 전체 데이터의 97%를 차지하는 탓에
    // 상위 10개가 거의 항상 식당/카페로만 채워지고, 사용자가 고른 courseSequence의
    // 다른 카테고리(공원, 전시회 등)는 후보가 하나도 없어 매번 fallback(아무 장소나 선택)이
    // 발동해서 항상 "식당→카페" 패턴만 나왔음.
    // 수정: 카테고리별로 가장 가까운 장소를 최대 6개씩 뽑아오도록 변경 -> 반경 안에 존재하는
    // 카테고리라면 courseSequence에 실제로 반영될 수 있게 함.
    @Query(value = "SELECT * FROM place p WHERE p.id IN (" +
            "SELECT ranked.id FROM (" +
            "  SELECT p2.id AS id, " +
            "    (6371 * acos(cos(radians(:lat)) * cos(radians(p2.latitude)) * " +
            "    cos(radians(p2.longitude) - radians(:lng)) + " +
            "    sin(radians(:lat)) * sin(radians(p2.latitude)))) AS distance, " +
            "    ROW_NUMBER() OVER (PARTITION BY p2.category ORDER BY " +
            "      (6371 * acos(cos(radians(:lat)) * cos(radians(p2.latitude)) * " +
            "      cos(radians(p2.longitude) - radians(:lng)) + " +
            "      sin(radians(:lat)) * sin(radians(p2.latitude)))) ASC" +
            "    ) AS rn " +
            "  FROM place p2 " +
            "  WHERE p2.id IN (SELECT MIN(id) FROM place GROUP BY latitude, longitude) " +
            ") ranked " +
            "WHERE ranked.distance <= :radiusKm AND ranked.rn <= 6" +
            ") " +
            "ORDER BY p.category, " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * " +
            "cos(radians(p.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(p.latitude)))) ASC",
            nativeQuery = true)
    List<Place> findNearbyPlaces(@Param("lat") double lat, @Param("lng") double lng, @Param("radiusKm") double radiusKm);
}