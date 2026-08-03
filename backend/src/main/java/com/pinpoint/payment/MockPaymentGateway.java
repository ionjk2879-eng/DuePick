package com.pinpoint.payment;

import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * PG 계약 전 개발용 목업 구현체. 실제 청구 없이 항상 성공 처리한다.
 */
@Service
public class MockPaymentGateway implements PaymentGateway {

    @Override
    public PaymentResult charge(PaymentRequest request) {
        String transactionId = "MOCK-" + UUID.randomUUID();
        return new PaymentResult(true, transactionId, "목업 결제 성공 (실제 청구 없음)");
    }
}
