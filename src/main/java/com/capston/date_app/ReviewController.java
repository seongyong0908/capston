// 리뷰 저장/조회 API 처리 (/api/review)

package com.capston.date_app;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    // 리뷰 저장
    @PostMapping("/review")
    public String saveReview(@RequestBody Review review) {
        reviewRepository.save(review);
        return "리뷰 저장 성공!";
    }

    // 리뷰 전체 조회
    @GetMapping("/review")
    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

    // 특정 리뷰 조회
    @GetMapping("/review/{id}")
    public Review getReview(@PathVariable Long id) {
        return reviewRepository.findById(id).orElse(null);
    }
}