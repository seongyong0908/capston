package com.capston.date_app;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoursePlaceRepository extends JpaRepository<CoursePlace, CoursePlaceId> {

    List<CoursePlace> findByCourseIdOrderByVisitOrder(Long courseId);
}
