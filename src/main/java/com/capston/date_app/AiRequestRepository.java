// AI 요청 데이터 저장/조회 담당

package com.capston.date_app;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AiRequestRepository extends JpaRepository<AiRequest, Long> {
}