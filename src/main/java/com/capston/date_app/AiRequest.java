// ai_requests 테이블과 연결된 Entity

package com.capston.date_app;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_requests")
public class AiRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long requestId;

    @Column(name = "user_id")
    private Long userId;

    private String location;

    private Integer budget;

    private String mood;

    @Column(name = "extra_condition")
    private String extraCondition;

    @Column(name = "result_course_id")
    private Long resultCourseId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    // Getter / Setter
    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Integer getBudget() { return budget; }
    public void setBudget(Integer budget) { this.budget = budget; }

    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }

    public String getExtraCondition() { return extraCondition; }
    public void setExtraCondition(String extraCondition) { this.extraCondition = extraCondition; }

    public Long getResultCourseId() { return resultCourseId; }
    public void setResultCourseId(Long resultCourseId) { this.resultCourseId = resultCourseId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}