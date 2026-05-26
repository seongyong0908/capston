// 코스 관련 API 요청을 처리하는 파일

package com.capston.date_app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CourseController {

    @Autowired
    private CourseRepository courseRepository;

    // 코스 저장
    @PostMapping("/course")
    public String saveCourse(@RequestBody Course course) {
        courseRepository.save(course);
        return "코스 저장 성공!";
    }

    // 코스 전체 조회
    @GetMapping("/course")
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    // 특정 코스 조회
    @GetMapping("/course/{id}")
    public Course getCourse(@PathVariable Long id) {
        return courseRepository.findById(id).orElse(null);
    }
}