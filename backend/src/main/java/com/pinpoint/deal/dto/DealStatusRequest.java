package com.pinpoint.deal.dto;

import com.pinpoint.domain.deal.DealStatus;
import jakarta.validation.constraints.NotNull;

public record DealStatusRequest(@NotNull DealStatus status) {}
