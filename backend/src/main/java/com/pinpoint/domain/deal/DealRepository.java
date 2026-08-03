package com.pinpoint.domain.deal;

import com.pinpoint.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DealRepository extends JpaRepository<Deal, Long> {
    List<Deal> findByUserOrderByCreatedAtDesc(User user);
}
