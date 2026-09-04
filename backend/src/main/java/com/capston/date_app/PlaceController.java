package com.capston.date_app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/place")
public class PlaceController {

    @Autowired
    private PlaceRepository placeRepository;

    @GetMapping
    public List<Place> getAllPlaces() {
        return placeRepository.findAll();
    }

    @GetMapping("/nearby")
    public List<Place> getNearbyPlaces(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "3") double radius) {
        return placeRepository.findNearbyPlaces(lat, lng, radius);
    }
}