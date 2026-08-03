package com.pinpoint.subscription.dto;

import com.pinpoint.domain.subscription.BillingCycle;
import com.pinpoint.domain.subscription.Subscription;
import com.pinpoint.domain.subscription.UsageType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SubscriptionResponse(
        Long id,
        String serviceName,
        BigDecimal amount,
        BillingCycle billingCycle,
        UsageType usageType,
        String accountingCategory,
        LocalDateTime createdAt
) {
    public static SubscriptionResponse from(Subscription s) {
        return new SubscriptionResponse(
                s.getId(), s.getServiceName(), s.getAmount(), s.getBillingCycle(),
                s.getUsageType(), s.getAccountingCategory(), s.getCreatedAt()
        );
    }
}
