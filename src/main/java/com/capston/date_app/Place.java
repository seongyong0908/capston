/*

package com.capston.date_app; // 패키지 경로 확인!

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "place") // DB의 실제 테이블 이름이 'place'인지 확인하세요!
@Getter
@Setter
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String place_name; // 장소 이름
    private Double latitude;   // 위도
    private Double longitude;  // 경도
}
 */

package com.capston.date_app;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "place")
@Getter
@Setter
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long course_id;
    private String place_name;
    private Double latitude;
    private Double longitude;
    private Integer visit_order;
    private String description;
}

