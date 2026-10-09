package com.capston.date_app;

import java.io.Serializable;
import java.util.Objects;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CoursePlaceId implements Serializable {

    private Long courseId;
    private Integer visitOrder;

    public CoursePlaceId() {
    }

    public CoursePlaceId(Long courseId, Integer visitOrder) {
        this.courseId = courseId;
        this.visitOrder = visitOrder;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof CoursePlaceId that)) {
            return false;
        }
        return Objects.equals(courseId, that.courseId)
                && Objects.equals(visitOrder, that.visitOrder);
    }

    @Override
    public int hashCode() {
        return Objects.hash(courseId, visitOrder);
    }
}
