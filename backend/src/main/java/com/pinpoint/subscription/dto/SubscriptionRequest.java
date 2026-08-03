package com.pinpoint.subscription.dto;

import com.pinpoint.domain.subscription.BillingCycle;
import com.pinpoint.domain.subscription.UsageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record SubscriptionRequest(
        @NotBlank String serviceName,
        @NotNull @Positive BigDecimal amount,
        @NotNull BillingCycle billingCycle,
        @NotNull UsageType usageType,
        String accountingCategory
) {}
