package com.capston.date_app;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "course_place")
@IdClass(CoursePlaceId.class)
@Getter
@Setter
public class CoursePlace {

    @Id
    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "place_id", nullable = false)
    private Long placeId;

    @Id
    @Column(name = "visit_order", nullable = false)
    private Integer visitOrder;
}
