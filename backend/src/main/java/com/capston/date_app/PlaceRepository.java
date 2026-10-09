package com.capston.date_app;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PlaceRepository extends JpaRepository<Place, Long> {

    // 추천 순서에서 영화관이나 미술관 같은 세부 분류를 선택할 수 있도록,
    // 큰 카테고리뿐 아니라 세부 분류별로 가까운 장소를 각각 확보한다.
    @Query(value = "SELECT * FROM place p WHERE p.id IN (" +
            "SELECT ranked.id FROM (" +
            "  SELECT p2.id AS id, " +
            "    (6371 * acos(cos(radians(:lat)) * cos(radians(p2.latitude)) * " +
            "    cos(radians(p2.longitude) - radians(:lng)) + " +
            "    sin(radians(:lat)) * sin(radians(p2.latitude)))) AS distance, " +
            "    ROW_NUMBER() OVER (PARTITION BY p2.category, p2.subcategory ORDER BY " +
            "      (6371 * acos(cos(radians(:lat)) * cos(radians(p2.latitude)) * " +
            "      cos(radians(p2.longitude) - radians(:lng)) + " +
            "      sin(radians(:lat)) * sin(radians(p2.latitude)))) ASC" +
            "    ) AS rn " +
            "  FROM place p2 " +
            "  WHERE p2.id IN (SELECT MIN(id) FROM place GROUP BY latitude, longitude) " +
            ") ranked " +
            "WHERE ranked.distance <= :radiusKm AND ranked.rn <= 50" +
            ") " +
            "ORDER BY p.category, " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * " +
            "cos(radians(p.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(p.latitude)))) ASC",
            nativeQuery = true)
    List<Place> findNearbyPlaces(@Param("lat") double lat, @Param("lng") double lng, @Param("radiusKm") double radiusKm);

    // 지도 화면의 "이 지역에서 찾기" 버튼 전용: 내 위치 기준 반경이 아니라,
    // 현재 지도에 실제로 보이는 사각형 영역(bounds) 안에 있는 장소만 가져옴.
    // 같은 위/경도가 중복 등록된 경우를 대비해 대표 id(MIN(id)) 하나만 남기고,
    // 화면을 아주 넓게(축소) 봤을 때 결과가 너무 많아지지 않도록 500건으로 제한.
    @Query(value = "SELECT * FROM place p WHERE " +
            "p.latitude BETWEEN :swLat AND :neLat AND " +
            "p.longitude BETWEEN :swLng AND :neLng AND " +
            "p.id IN (SELECT MIN(id) FROM place GROUP BY latitude, longitude) " +
            "LIMIT 500",
            nativeQuery = true)
    List<Place> findPlacesInBounds(@Param("swLat") double swLat, @Param("swLng") double swLng,
                                    @Param("neLat") double neLat, @Param("neLng") double neLng);

    java.util.Optional<Place> findFirstByPlaceName(String placeName);
}