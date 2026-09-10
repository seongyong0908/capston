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
    // 1차 수정: 카테고리별로 가장 가까운 장소를 최대 6개씩 뽑아오도록 변경.
    // 2차 수정(현재): "문화예술" 하나의 category 안에 영화관/미술관/공연장/도서관 등
    // 6가지 서로 다른 업종(subcategory)이 섞여있다 보니, 상위 6개가 전부 도서관/갤러리로만
    // 채워지고 정작 더 먼 영화관은 후보에서 밀려나는 경우가 실제로 확인됨(강남/청담, 이태원 등).
    // subcategory는 DB에 없어서 SQL에서 직접 나눠 뽑을 수 없으므로, 카테고리별 개수를
    // 넉넉하게 늘려서(6 -> 50) 같은 category 안의 여러 subcategory가 골고루 포함되도록 함.
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
}