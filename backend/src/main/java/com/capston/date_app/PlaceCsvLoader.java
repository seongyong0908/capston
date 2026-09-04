package com.capston.date_app;

import com.opencsv.CSVReader;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Component
public class PlaceCsvLoader implements CommandLineRunner {

    private final PlaceRepository placeRepository;
    private static final Long DEFAULT_COURSE_ID = 3L;

    public PlaceCsvLoader(PlaceRepository placeRepository) {
        this.placeRepository = placeRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        long existingCount = placeRepository.count();
        if (existingCount > 0) {
            System.out.println("[PlaceCsvLoader] 이미 place 데이터가 " + existingCount + "건 존재하여 CSV 로딩을 건너뜁니다.");
            return;
        }

        System.out.println("[PlaceCsvLoader] CSV 데이터 로딩 시작...");

        List<Place> places = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(
                new ClassPathResource("data/place_final.csv").getInputStream(),
                StandardCharsets.UTF_8))) {

            String[] tokens;
            boolean isFirstLine = true;

            while ((tokens = reader.readNext()) != null) {
                if (isFirstLine) {
                    isFirstLine = false;
                    continue;
                }
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
                    System.out.println("[PlaceCsvLoader] 행 파싱 실패, 건너뜀");
                }
            }
        }

        placeRepository.saveAll(places);
        System.out.println("[PlaceCsvLoader] 총 " + places.size() + "건 저장 완료");
    }
}