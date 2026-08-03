package com.pinpoint.domain.subscription;

import com.pinpoint.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByUserOrderByCreatedAtDesc(User user);
    List<Subscription> findByUserAndUsageType(User user, UsageType usageType);
}
