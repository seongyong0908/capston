package com.capston.date_app;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Component
public class PlaceCsvLoader implements CommandLineRunner {

    private final PlaceRepository placeRepository;

    // 이 course_id는 임시로 고정. 실제 서비스 로직 완성되면 바꿔야 함
    private static final Long DEFAULT_COURSE_ID = 3L;

    public PlaceCsvLoader(PlaceRepository placeRepository) {
        this.placeRepository = placeRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // 이미 데이터가 들어가 있으면 중복 방지를 위해 건너뜀
        long existingCount = placeRepository.count();
        if (existingCount > 0) {
            System.out.println("[PlaceCsvLoader] 이미 place 데이터가 " + existingCount + "건 존재하여 CSV 로딩을 건너뜁니다.");
            return;
        }

        System.out.println("[PlaceCsvLoader] CSV 데이터 로딩 시작...");

        List<Place> places = new ArrayList<>();

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(
                        new ClassPathResource("data/place_final.csv").getInputStream(),
                        StandardCharsets.UTF_8))) {

            String line;
            boolean isFirstLine = true;

            while ((line = br.readLine()) != null) {
                if (isFirstLine) {
                    isFirstLine = false; // 헤더 건너뜀
                    continue;
                }
                if (line.isBlank()) continue;

                String[] tokens = parseCsvLine(line);
                // CSV 컬럼 순서: id, place_name, address, phone, latitude, longitude, category, subcategory, description, source_file
                if (tokens.length < 9) continue;

                try {
                    Place place = new Place();
                    place.setCourseId(DEFAULT_COURSE_ID);
                    place.setPlaceName(tokens[1].trim());
                    place.setAddress(tokens[2].trim());
                    place.setLatitude(new BigDecimal(tokens[4].trim()));
                    place.setLongitude(new BigDecimal(tokens[5].trim()));
                    place.setVisitOrder(1);
                    place.setCategory(tokens[6].trim());
                    place.setDescription(tokens[8].trim());

                    places.add(place);
                } catch (Exception e) {
                    System.out.println("[PlaceCsvLoader] 행 파싱 실패, 건너뜀: " + line);
                }
            }
        }

        placeRepository.saveAll(places);
        System.out.println("[PlaceCsvLoader] 총 " + places.size() + "건 저장 완료");
    }

    // 쉼표로 구분하되, 큰따옴표로 감싸진 필드 안의 쉼표는 무시하는 간단한 CSV 파서
    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());
        return result.toArray(new String[0]);
    }
}