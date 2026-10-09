package com.capston.date_app;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    @Query("select e from CalendarEvent e, Course c "
            + "where e.courseId = c.id and c.userId = :userId "
            + "order by e.eventDate asc, e.startTime asc")
    List<CalendarEvent> findAllForUser(@Param("userId") Long userId);

    @Query("select e from CalendarEvent e, Course c "
            + "where e.courseId = c.id and e.id = :eventId and c.userId = :userId")
    Optional<CalendarEvent> findForUser(
            @Param("eventId") Long eventId,
            @Param("userId") Long userId);
}
