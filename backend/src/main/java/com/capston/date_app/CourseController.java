package com.capston.date_app;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CourseController {

    private static final String SAVED = "SAVED";
    private static final String SCHEDULED = "SCHEDULED";

    private final CourseRepository courseRepository;
    private final CoursePlaceRepository coursePlaceRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final UserRepository userRepository;
    private final PlaceRepository placeRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;

    @PostMapping("/courses/save")
    @Transactional
    public CourseView saveCourse(@RequestBody CourseRequest request) {
        User user = requireUser(request.loginId());
        validateRoomMembership(user, request.roomId());
        Course course = createCourse(request, user, SAVED);
        return toCourseView(course);
    }

    @PostMapping("/courses/schedule")
    @Transactional
    public CalendarEventView scheduleNewCourse(@RequestBody ScheduleCourseRequest request) {
        User user = requireUser(request.loginId());
        requireRoomMembership(user, request.roomId());
        Course course = createCourse(
                new CourseRequest(
                        request.loginId(),
                        request.roomId(),
                        request.title(),
                        request.region(),
                        request.eventDate(),
                        request.startTime(),
                        request.endTime(),
                        request.placeIds()),
                user,
                SCHEDULED);
        CalendarEvent event = createCalendarEvent(
                course, request.roomId(), request.title(), request.eventDate(),
                request.startTime(), request.endTime());
        return toCalendarEventView(event);
    }

    @PostMapping("/courses/{courseId}/schedule")
    @Transactional
    public CalendarEventView scheduleSavedCourse(
            @PathVariable Long courseId,
            @RequestBody ScheduleRequest request) {
        User user = requireUser(request.loginId());
        requireRoomMembership(user, request.roomId());
        Course course = courseRepository.findByIdAndUserId(courseId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "보관 코스를 찾을 수 없습니다."));
        if (!SAVED.equals(course.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "보관 상태인 코스만 일정에 추가할 수 있습니다.");
        }

        course.setRoomId(request.roomId());
        course.setStatus(SCHEDULED);
        course.setPlannedDate(request.eventDate());
        course.setStartTime(request.startTime());
        course.setEndTime(request.endTime());
        courseRepository.save(course);
        CalendarEvent event = createCalendarEvent(
                course, request.roomId(), request.title(), request.eventDate(),
                request.startTime(), request.endTime());
        return toCalendarEventView(event);
    }

    @GetMapping("/courses/saved")
    @Transactional(readOnly = true)
    public List<CourseView> getSavedCourses(@RequestParam("login_id") String loginId) {
        User user = requireUser(loginId);
        return courseRepository.findByUserIdAndStatusOrderByIdDesc(user.getId(), SAVED).stream()
                .map(this::toCourseView)
                .toList();
    }

    @DeleteMapping("/courses/{courseId}")
    @Transactional
    public void deleteSavedCourse(
            @PathVariable Long courseId,
            @RequestParam("login_id") String loginId) {
        User user = requireUser(loginId);
        Course course = courseRepository.findByIdAndUserId(courseId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "코스를 찾을 수 없습니다."));
        if (!SAVED.equals(course.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "보관 상태인 코스만 삭제할 수 있습니다.");
        }
        coursePlaceRepository.deleteAll(coursePlaceRepository.findByCourseIdOrderByVisitOrder(courseId));
        courseRepository.delete(course);
    }

    @GetMapping("/calendar")
    @Transactional(readOnly = true)
    public List<CalendarEventView> getCalendarEvents(@RequestParam("login_id") String loginId) {
        User user = requireUser(loginId);
        return calendarEventRepository.findAllForUser(user.getId())
                .stream()
                .map(this::toCalendarEventView)
                .toList();
    }

    @PutMapping("/calendar/{eventId}")
    @Transactional
    public CalendarEventView updateCalendarEvent(
            @PathVariable Long eventId,
            @RequestBody UpdateCalendarRequest request) {
        User user = requireUser(request.loginId());
        CalendarEvent event = calendarEventRepository.findForUser(eventId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "캘린더 일정을 찾을 수 없습니다."));
        validateEventFields(request.title(), request.eventDate());
        event.setTitle(request.title().trim());
        event.setEventDate(request.eventDate());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        calendarEventRepository.save(event);

        Course course = courseRepository.findById(event.getCourseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "연결된 코스를 찾을 수 없습니다."));
        course.setPlannedDate(request.eventDate());
        course.setStartTime(request.startTime());
        course.setEndTime(request.endTime());
        courseRepository.save(course);
        return toCalendarEventView(event);
    }

    @DeleteMapping("/calendar/{eventId}")
    @Transactional
    public void deleteCalendarEvent(
            @PathVariable Long eventId,
            @RequestParam("login_id") String loginId) {
        User user = requireUser(loginId);
        CalendarEvent event = calendarEventRepository.findForUser(eventId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "캘린더 일정을 찾을 수 없습니다."));
        Course course = courseRepository.findByIdAndUserId(event.getCourseId(), user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "연결된 코스를 찾을 수 없습니다."));
        calendarEventRepository.delete(event);
        coursePlaceRepository.deleteAll(
                coursePlaceRepository.findByCourseIdOrderByVisitOrder(course.getId()));
        courseRepository.delete(course);
    }

    private Course createCourse(CourseRequest request, User user, String status) {
        validateCourseRequest(request);
        validateRoomMembership(user, request.roomId());

        List<Long> placeIds = request.placeIds();
        if (placeIds.stream().anyMatch(id -> id == null || id <= 0)
                || placeIds.size() != Set.copyOf(placeIds).size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "장소 ID가 올바르지 않거나 중복되었습니다.");
        }
        Map<Long, Place> placesById = placeRepository.findAllById(placeIds).stream()
                .collect(Collectors.toMap(Place::getId, Function.identity()));
        if (placesById.size() != placeIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "코스에 존재하지 않는 장소가 포함되어 있습니다.");
        }

        Course course = new Course();
        course.setUserId(user.getId());
        course.setRoomId(request.roomId());
        course.setCourseTitle(request.title().trim());
        course.setRegion(request.region());
        course.setStatus(status);
        course.setPlannedDate(request.plannedDate());
        course.setStartTime(request.startTime());
        course.setEndTime(request.endTime());
        course = courseRepository.save(course);

        List<CoursePlace> coursePlaces = new ArrayList<>();
        for (int index = 0; index < placeIds.size(); index++) {
            CoursePlace coursePlace = new CoursePlace();
            coursePlace.setCourseId(course.getId());
            coursePlace.setPlaceId(placeIds.get(index));
            coursePlace.setVisitOrder(index + 1);
            coursePlaces.add(coursePlace);
        }
        coursePlaceRepository.saveAll(coursePlaces);
        return course;
    }

    private CalendarEvent createCalendarEvent(
            Course course,
            Long roomId,
            String title,
            LocalDate eventDate,
            LocalTime startTime,
            LocalTime endTime) {
        validateEventFields(title, eventDate);
        CalendarEvent event = new CalendarEvent();
        event.setCourseId(course.getId());
        event.setRoomId(roomId);
        event.setTitle(title.trim());
        event.setEventDate(eventDate);
        event.setStartTime(startTime);
        event.setEndTime(endTime);
        return calendarEventRepository.save(event);
    }

    private User requireUser(String loginId) {
        if (loginId == null || loginId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "로그인 아이디가 필요합니다.");
        }
        return userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    private void validateRoomMembership(User user, Long roomId) {
        if (roomId == null) {
            return;
        }
        requireRoomMembership(user, roomId);
    }

    private void requireRoomMembership(User user, Long roomId) {
        if (roomId == null || roomRepository.findById(roomId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "실제 방을 선택해 주세요.");
        }
        boolean isAcceptedMember = roomMemberRepository.findByRoomId(roomId).stream()
                .anyMatch(member -> user.getLoginId().equals(member.getUserId())
                        && "ACCEPTED".equalsIgnoreCase(member.getStatus()));
        if (!isAcceptedMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "선택한 방의 승인된 멤버가 아닙니다.");
        }
    }

    private void validateCourseRequest(CourseRequest request) {
        if (request == null || request.title() == null || request.title().isBlank()
                || request.placeIds() == null || request.placeIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "코스 제목과 장소 목록이 필요합니다.");
        }
    }

    private void validateEventFields(String title, LocalDate eventDate) {
        if (title == null || title.isBlank() || eventDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "일정 제목과 날짜를 입력해 주세요.");
        }
    }

    private CourseView toCourseView(Course course) {
        Room room = course.getRoomId() == null
                ? null
                : roomRepository.findById(course.getRoomId()).orElse(null);
        List<CoursePlaceView> places = coursePlaceRepository.findByCourseIdOrderByVisitOrder(course.getId())
                .stream()
                .map(coursePlace -> placeRepository.findById(coursePlace.getPlaceId())
                        .map(place -> new CoursePlaceView(
                                place.getId(),
                                place.getPlaceName(),
                                place.getCategory(),
                                place.getSubcategory(),
                                place.getAddress(),
                                place.getDescription(),
                                place.getLatitude(),
                                place.getLongitude(),
                                place.getPhone(),
                                coursePlace.getVisitOrder()))
                        .orElse(null))
                .filter(view -> view != null)
                .toList();
        return new CourseView(
                course.getId(),
                course.getCourseTitle(),
                course.getRegion(),
                course.getRoomId(),
                room == null ? null : room.getRoomName(),
                room == null ? null : room.getRoomType(),
                course.getStatus(),
                course.getPlannedDate(),
                course.getStartTime(),
                course.getEndTime(),
                places);
    }

    private CalendarEventView toCalendarEventView(CalendarEvent event) {
        Course course = courseRepository.findById(event.getCourseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "연결된 코스를 찾을 수 없습니다."));
        Room room = roomRepository.findById(event.getRoomId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "연결된 방을 찾을 수 없습니다."));
        String placeNames = coursePlaceRepository.findByCourseIdOrderByVisitOrder(course.getId()).stream()
                .map(coursePlace -> placeRepository.findById(coursePlace.getPlaceId())
                        .map(Place::getPlaceName)
                        .orElse(""))
                .filter(name -> !name.isBlank())
                .collect(Collectors.joining(" → "));
        return new CalendarEventView(
                event.getId(),
                event.getCourseId(),
                event.getTitle(),
                event.getEventDate(),
                event.getStartTime(),
                event.getEndTime(),
                event.getRoomId(),
                room.getRoomName(),
                room.getRoomType(),
                placeNames);
    }

    public record CourseRequest(
            @JsonProperty("login_id") String loginId,
            Long roomId,
            String title,
            String region,
            LocalDate plannedDate,
            LocalTime startTime,
            LocalTime endTime,
            List<Long> placeIds) {
    }

    public record ScheduleCourseRequest(
            @JsonProperty("login_id") String loginId,
            Long roomId,
            String title,
            String region,
            LocalDate eventDate,
            LocalTime startTime,
            LocalTime endTime,
            List<Long> placeIds) {
    }

    public record ScheduleRequest(
            @JsonProperty("login_id") String loginId,
            Long roomId,
            String title,
            LocalDate eventDate,
            LocalTime startTime,
            LocalTime endTime) {
    }

    public record UpdateCalendarRequest(
            @JsonProperty("login_id") String loginId,
            String title,
            LocalDate eventDate,
            LocalTime startTime,
            LocalTime endTime) {
    }

    public record CourseView(
            Long id,
            String title,
            String region,
            Long roomId,
            String roomName,
            String roomType,
            String status,
            LocalDate plannedDate,
            LocalTime startTime,
            LocalTime endTime,
            List<CoursePlaceView> places) {
    }

    public record CoursePlaceView(
            Long id,
            String name,
            String category,
            String subcategory,
            String address,
            String description,
            java.math.BigDecimal latitude,
            java.math.BigDecimal longitude,
            String phone,
            Integer visitOrder) {
    }

    public record CalendarEventView(
            Long id,
            Long courseId,
            String title,
            LocalDate eventDate,
            LocalTime startTime,
            LocalTime endTime,
            Long roomId,
            String roomName,
            String roomType,
            String description) {
    }
}
