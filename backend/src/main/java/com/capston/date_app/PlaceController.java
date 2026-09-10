package com.capston.date_app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/place")
public class PlaceController {

    @Autowired
    private PlaceRepository placeRepository;

    // CATEGORY_MAP(main.py)과 place_final.csv에 실제로 존재하는 카테고리 라벨 전체
    private static final Set<String> ALL_CATEGORIES = Set.of(
            "카페", "식당", "실내액티비티", "문화예술", "쇼핑", "공원산책", "스포츠레저"
    );

    // 1km -> 2km -> 3km -> 5km -> 7km 순으로 넓혀가며, 8개 카테고리가 다 잡히면 그 단계에서 멈춤
    private static final double[] RADIUS_STEPS_KM = {1, 2, 3, 5, 7};

    @GetMapping
    public List<Place> getAllPlaces() {
        return placeRepository.findAll();
    }

    @GetMapping("/nearby")
    public List<Place> getNearbyPlaces(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "3") double radius,
            @RequestParam(defaultValue = "false") boolean strict) {

        // strict=true: 반경을 자동으로 넓히지 않고 요청한 radius 안에서만 정확하게 검색.
        // (지도 화면의 "내 주변 데이트 코스 찾기" 버튼 전용 - 실제로 화면에 그 반경만큼만 마커를 찍어야 하므로)
        if (strict) {
            return placeRepository.findNearbyPlaces(lat, lng, radius);
        }

        // strict=false(기본, 이전과 동일): AI 추천 흐름에서 쓰는 로직으로,
        // 8개 카테고리가 다 채워질 때까지 1km -> 7km까지 반경을 넓혀가며 후보를 넉넉히 확보함.
        List<Place> result = List.of();

        for (double step : RADIUS_STEPS_KM) {
            result = placeRepository.findNearbyPlaces(lat, lng, step);

            Set<String> foundCategories = result.stream()
                    .map(Place::getCategory)
                    .collect(Collectors.toSet());

            if (foundCategories.containsAll(ALL_CATEGORIES)) {
                // 모든 카테고리가 이 반경 안에서 이미 채워졌으니 더 넓힐 필요 없음
                break;
            }
        }

        return result;
    }

    // 지도 화면의 "이 지역에서 찾기" 버튼 전용: 내 위치 반경이 아니라
    // 현재 지도에 보이는 영역(남서/북동 좌표)에 있는 장소만 가져옴
    @GetMapping("/in-bounds")
    public List<Place> getPlacesInBounds(
            @RequestParam double swLat,
            @RequestParam double swLng,
            @RequestParam double neLat,
            @RequestParam double neLng) {
        return placeRepository.findPlacesInBounds(swLat, swLng, neLat, neLng);
    }
}