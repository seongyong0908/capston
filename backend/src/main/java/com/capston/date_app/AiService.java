package com.capston.date_app;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AiService {

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PreferenceRepository preferenceRepository;

    public String getRecommendationFromPython(Map<String, Object> requestData) {
        Map<String, Object> recommendationRequest = withRoomPreferences(requestData);
        String pythonUrl = "http://127.0.0.1:8000/api/recommend";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<byte[]> response = new RestTemplate().postForEntity(
                    pythonUrl,
                    new HttpEntity<>(recommendationRequest, headers),
                    byte[].class
            );
            if (response.getBody() == null) {
                throw new IllegalStateException("Python 추천 서버가 빈 응답을 반환했습니다.");
            }

            String pythonResponse = new String(response.getBody(), StandardCharsets.UTF_8);
            Map<String, Object> responseData = objectMapper.readValue(
                    pythonResponse,
                    new TypeReference<Map<String, Object>>() {}
            );
            Object rawCourses = responseData.get("courses");
            if (!(rawCourses instanceof List<?>)) {
                throw new IllegalStateException("Python 추천 응답에 courses 목록이 없습니다.");
            }

            List<Map<String, Object>> courses = objectMapper.convertValue(
                    rawCourses,
                    new TypeReference<List<Map<String, Object>>>() {}
            );
            Map<String, Long> candidateIdsByName = new HashMap<>();
            Set<Long> candidateIds = new HashSet<>();
            Object rawCandidates = recommendationRequest.get("places");
            if (rawCandidates instanceof List<?> candidates) {
                for (Object candidate : candidates) {
                    if (candidate instanceof Map<?, ?> candidateData) {
                        Long candidateId = toLong(candidateData.get("id"));
                        Object candidateName = candidateData.get("name");
                        if (candidateId != null && candidateName instanceof String name) {
                            candidateIds.add(candidateId);
                            candidateIdsByName.put(name, candidateId);
                        }
                    }
                }
            }

            for (Map<String, Object> course : courses) {
                Object rawPlaces = course.get("places");
                if (!(rawPlaces instanceof List<?>)) {
                    continue;
                }

                List<Map<String, Object>> places = objectMapper.convertValue(
                        rawPlaces,
                        new TypeReference<List<Map<String, Object>>>() {}
                );
                List<Map<String, Object>> verifiedPlaces = new ArrayList<>();
                for (Map<String, Object> place : places) {
                    Long placeId = toLong(place.get("id"));
                    if (placeId == null || !candidateIds.contains(placeId)) {
                        Object placeName = place.get("place_name");
                        placeId = placeName instanceof String name ? candidateIdsByName.get(name) : null;
                    }
                    if (placeId == null) {
                        continue;
                    }

                    Optional<Place> dbPlace = placeRepository.findById(placeId);
                    if (dbPlace.isEmpty()) {
                        continue;
                    }

                    Place dbPlaceData = dbPlace.get();
                    place.put("id", dbPlaceData.getId());
                    place.put("place_name", dbPlaceData.getPlaceName());
                    place.put("address", dbPlaceData.getAddress());
                    place.put("lat", dbPlaceData.getLatitude());
                    place.put("lng", dbPlaceData.getLongitude());
                    place.put("phone", dbPlaceData.getPhone());
                    place.put("category", dbPlaceData.getCategory());
                    place.put("subcategory", dbPlaceData.getSubcategory());
                    place.put("tags", dbPlaceData.getTags());
                    place.put("region", dbPlaceData.getRegion());
                    verifiedPlaces.add(place);
                }
                course.put("places", verifiedPlaces);
            }

            responseData.put("courses", courses);
            return objectMapper.writeValueAsString(responseData);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("추천 응답의 JSON을 처리하지 못했습니다.", e);
        } catch (org.springframework.web.client.RestClientException e) {
            throw new IllegalStateException("Python 추천 서버에 연결하지 못했습니다.", e);
        }
    }

    public String getRankedAlternativesFromPython(Map<String, Object> requestData) {
        Map<String, Object> recommendationRequest = withRoomPreferences(requestData);
        String region = requiredString(recommendationRequest, "region");
        String category = requiredString(recommendationRequest, "category");
        double latitude = requiredDouble(recommendationRequest, "lat");
        double longitude = requiredDouble(recommendationRequest, "lng");
        Set<Long> excludedIds = getLongValues(recommendationRequest.get("excludePlaceIds"));
        List<String> allowedDistricts = getAllowedDistricts(region);

        List<Place> candidates = placeRepository.findNearbyPlaces(latitude, longitude, 7).stream()
                .filter(place -> category.equals(place.getCategory()))
                .filter(place -> place.getAddress() != null
                        && allowedDistricts.stream().anyMatch(place.getAddress()::contains))
                .filter(place -> place.getId() != null && !excludedIds.contains(place.getId()))
                .collect(Collectors.toList());
        if (candidates.isEmpty()) {
            throw new IllegalArgumentException("선택한 지역에 같은 카테고리의 대체 장소가 없습니다.");
        }

        Map<String, Object> pythonRequest = new HashMap<>(recommendationRequest);
        pythonRequest.put("candidatePlaces", candidates.stream()
                .map(this::toCandidateMap)
                .collect(Collectors.toList()));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            ResponseEntity<byte[]> response = new RestTemplate().postForEntity(
                    "http://127.0.0.1:8000/api/recommend-alternatives",
                    new HttpEntity<>(pythonRequest, headers),
                    byte[].class
            );
            if (response.getBody() == null) {
                throw new IllegalStateException("Python 추천 서버가 대체 장소 응답을 반환하지 않았습니다.");
            }

            List<Map<String, Object>> ranked = objectMapper.readValue(
                    new String(response.getBody(), StandardCharsets.UTF_8),
                    new TypeReference<List<Map<String, Object>>>() {}
            );
            Map<Long, Map<String, Object>> candidatesById = candidates.stream()
                    .collect(Collectors.toMap(Place::getId, this::toCandidateMap));
            List<Map<String, Object>> verified = new ArrayList<>();
            Set<Long> includedIds = new HashSet<>();

            for (Map<String, Object> recommendation : ranked) {
                Long placeId = toLong(recommendation.get("id"));
                Map<String, Object> candidate = placeId == null ? null : candidatesById.get(placeId);
                if (candidate == null || !includedIds.add(placeId)) {
                    continue;
                }
                Map<String, Object> result = new HashMap<>(candidate);
                result.put("reason", recommendation.getOrDefault("reason", ""));
                verified.add(result);
                if (verified.size() == 4) {
                    break;
                }
            }
            return objectMapper.writeValueAsString(verified);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("대체 장소 추천 응답을 처리하지 못했습니다.", e);
        } catch (org.springframework.web.client.RestClientException e) {
            throw new IllegalStateException("Python 추천 서버에서 대체 장소를 가져오지 못했습니다.", e);
        }
    }

    private Map<String, Object> withRoomPreferences(Map<String, Object> requestData) {
        Map<String, Object> enriched = new HashMap<>(requestData);
        String loginId = requiredString(enriched, "login_id");
        Long roomId = toLong(enriched.get("roomId"));
        List<RoomMember> acceptedMembers;

        if (roomId == null) {
            acceptedMembers = List.of();
        } else {
            acceptedMembers = roomMemberRepository.findByRoomId(roomId).stream()
                    .filter(member -> "ACCEPTED".equalsIgnoreCase(member.getStatus()))
                    .collect(Collectors.toList());
            boolean requesterIsMember = acceptedMembers.stream()
                    .anyMatch(member -> loginId.equals(member.getUserId()));
            if (!requesterIsMember) {
                throw new IllegalArgumentException("로그인 사용자가 선택한 방의 승인된 멤버가 아닙니다.");
            }
        }

        List<String> memberLoginIds = roomId == null
                ? List.of(loginId)
                : acceptedMembers.stream().map(RoomMember::getUserId).distinct().collect(Collectors.toList());
        List<Map<String, String>> roomPreferences = new ArrayList<>();
        for (String memberLoginId : memberLoginIds) {
            User user = userRepository.findByLoginId(memberLoginId)
                    .orElseThrow(() -> new IllegalStateException("방 멤버 정보를 찾을 수 없습니다."));
            Preference preference = preferenceRepository.findByUser(user);
            if (preference == null) {
                continue;
            }
            Map<String, String> profile = new HashMap<>();
            profile.put("likeVibe", preference.getLikeVibe());
            profile.put("dislikedActivities", preference.getHateAct());
            profile.put("dietaryRestrictions", preference.getFoodLimit());
            profile.put("foodNotes", preference.getFoodMemo());
            roomPreferences.add(profile);
        }

        enriched.put("roomPreferences", roomPreferences);
        return enriched;
    }

    private Map<String, Object> toCandidateMap(Place place) {
        Map<String, Object> candidate = new HashMap<>();
        candidate.put("id", place.getId());
        candidate.put("name", place.getPlaceName());
        candidate.put("category", place.getCategory());
        candidate.put("subcategory", place.getSubcategory());
        candidate.put("tags", place.getTags());
        candidate.put("address", place.getAddress());
        candidate.put("region", place.getRegion());
        candidate.put("phone", place.getPhone());
        candidate.put("latitude", place.getLatitude());
        candidate.put("longitude", place.getLongitude());
        candidate.put("description", place.getDescription());
        candidate.put("rating", place.getRating());
        return candidate;
    }

    private List<String> getAllowedDistricts(String region) {
        Map<String, List<String>> regionDistricts = Map.of(
                "홍대/연남동", List.of("마포구"),
                "강남/청담", List.of("강남구"),
                "성수동", List.of("성동구"),
                "잠실", List.of("송파구"),
                "이태원/한남", List.of("용산구"),
                "여의도", List.of("영등포구")
        );
        List<String> districts = regionDistricts.get(region);
        if (districts == null) {
            throw new IllegalArgumentException("지원하지 않는 지역입니다: " + region);
        }
        return districts;
    }

    private String requiredString(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value instanceof String text && !text.isBlank()) {
            return text;
        }
        throw new IllegalArgumentException("필수 추천 조건이 없습니다: " + key);
    }

    private double requiredDouble(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        throw new IllegalArgumentException("유효한 좌표가 없습니다: " + key);
    }

    private Set<Long> getLongValues(Object value) {
        Set<Long> ids = new HashSet<>();
        if (value instanceof List<?> values) {
            for (Object item : values) {
                Long id = toLong(item);
                if (id != null) {
                    ids.add(id);
                }
            }
        }
        return ids;
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String text) {
            try {
                return Long.valueOf(text);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
