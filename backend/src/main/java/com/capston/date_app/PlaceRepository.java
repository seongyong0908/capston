package com.capston.date_app;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PlaceRepository extends JpaRepository<Place, Long> {

    @Query(value = "SELECT * FROM place p WHERE p.id IN (" +
            "SELECT MIN(id) FROM place GROUP BY latitude, longitude" +
            ") AND " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * " +
            "cos(radians(p.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(p.latitude)))) <= :radiusKm " +
            "ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * " +
            "cos(radians(p.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(p.latitude)))) ASC " +
            "LIMIT 10", nativeQuery = true)
    List<Place> findNearbyPlaces(@Param("lat") double lat, @Param("lng") double lng, @Param("radiusKm") double radiusKm);
}