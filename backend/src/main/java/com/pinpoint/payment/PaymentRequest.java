package com.pinpoint.payment;

import java.math.BigDecimal;

public record PaymentRequest(String userEmail, BigDecimal amount, String description) {}
