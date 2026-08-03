package com.pinpoint.plan.dto;

import java.time.LocalDateTime;

public record PlanResponse(String planType, boolean isPro, LocalDateTime expiresAt) {}
