package com.capston.date_app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/place")
public class PlaceController {

    @Autowired
    private PlaceRepository placeRepository;

    // 전처리 장소 데이터에 실제로 들어 있는 카테고리 라벨
    private static final Set<String> ALL_CATEGORIES = Set.of(
            "카페", "식당", "식당&주류", "문화예술", "액티비티", "쇼핑", "공원산책"
    );

    // 1km -> 2km -> 3km -> 5km -> 7km 순으로 후보 반경을 넓힌다.
    private static final double[] RADIUS_STEPS_KM = {1, 2, 3, 5, 7};

    private static final Map<String, List<String>> REGION_DISTRICTS = Map.of(
            "홍대/연남동", List.of("마포구"),
            "강남/청담", List.of("강남구"),
            "성수동", List.of("성동구"),
            "잠실", List.of("송파구"),
            "이태원/한남", List.of("용산구"),
            "여의도", List.of("영등포구")
    );

    private static final Map<String, Set<String>> REQUIRED_SUBCATEGORIES = Map.of(
            "movie", Set.of("영화관"),
            "exhibition", Set.of("미술관/갤러리", "박물관/기념관")
    );

    private static final Map<String, List<String>> REGION_KEYWORDS = Map.of(
            "홍대/연남동", List.of("마포구", "홍대", "연남", "합정", "상수"),
            "강남/청담", List.of("강남구", "청담", "역삼", "신사", "논현", "압구정"),
            "성수동", List.of("성동구", "성수"),
            "잠실", List.of("송파구", "잠실", "신천", "방이", "석촌"),
            "이태원/한남", List.of("용산구", "이태원", "한남", "해방촌"),
            "여의도", List.of("영등포구", "여의도")
    );

    @GetMapping
    public List<Place> getAllPlaces() {
        return placeRepository.findAll();
    }

    @GetMapping("/nearby")
    public List<Place> getNearbyPlaces(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "3") double radius,
            @RequestParam(defaultValue = "false") boolean strict,
            @RequestParam(required = false) List<String> courseSequence,
            @RequestParam(required = false) String region) {

        // strict=true: 반경을 자동으로 넓히지 않고 요청한 radius 안에서만 정확하게 검색.
        // (지도 화면의 "내 주변 데이트 코스 찾기" 버튼 전용 - 실제로 화면에 그 반경만큼만 마커를 찍어야 하므로)
        if (strict) {
            return placeRepository.findNearbyPlaces(lat, lng, radius);
        }

        // strict=false(기본): AI 추천 흐름에서 쓰는 로직으로,
        // 모든 대분류와 선택한 세부분류가 확인될 때까지 반경을 넓혀 후보를 확보한다.
        List<Place> result = List.of();

        for (double step : RADIUS_STEPS_KM) {
            result = placeRepository.findNearbyPlaces(lat, lng, step);

            Set<String> foundCategories = result.stream()
                    .map(Place::getCategory)
                    .collect(Collectors.toSet());

            boolean foundRequestedSubcategories = true;
            if (courseSequence != null) {
                for (String selectedCategory : courseSequence) {
                    Set<String> requiredSubcategories = REQUIRED_SUBCATEGORIES.get(selectedCategory);
                    if (requiredSubcategories != null && result.stream().noneMatch(place ->
                            requiredSubcategories.contains(place.getSubcategory())
                                    && isInSelectedRegion(place, region))) {
                        foundRequestedSubcategories = false;
                        break;
                    }
                }
            }

            if (foundCategories.containsAll(ALL_CATEGORIES) && foundRequestedSubcategories) {
                break;
            }
        }

        return result;
    }

    private boolean isInSelectedRegion(Place place, String region) {
        if (region == null || region.isBlank()) {
            return true;
        }

        List<String> keywords = REGION_KEYWORDS.getOrDefault(region, List.of(region));
        String address = place.getAddress() == null ? "" : place.getAddress();
        String placeRegion = place.getRegion() == null ? "" : place.getRegion();
        return keywords.stream().anyMatch(keyword ->
                address.contains(keyword) || placeRegion.contains(keyword));
    }

    @GetMapping("/alternatives")
    public List<Place> getPlaceAlternatives(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam String category,
            @RequestParam String region) {
        List<String> allowedDistricts = REGION_DISTRICTS.get(region);
        if (allowedDistricts == null || allowedDistricts.isEmpty()) {
            throw new IllegalArgumentException("지원하지 않는 지역입니다: " + region);
        }

        return placeRepository.findNearbyPlaces(lat, lng, 7).stream()
                .filter(place -> category.equals(place.getCategory()))
                .filter(place -> place.getAddress() != null
                        && allowedDistricts.stream().anyMatch(place.getAddress()::contains))
                .collect(Collectors.toList());
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