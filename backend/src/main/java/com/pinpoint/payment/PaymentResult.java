package com.pinpoint.payment;

public record PaymentResult(boolean success, String transactionId, String message) {}
