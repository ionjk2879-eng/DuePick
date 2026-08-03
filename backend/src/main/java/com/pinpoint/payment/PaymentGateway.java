package com.pinpoint.payment;

/**
 * 실제 PG사(토스페이먼츠 등) 연동 지점. 계약 전까지는 {@link MockPaymentGateway}를 사용하고,
 * 연동 시점에 이 인터페이스를 구현하는 새 Bean으로 교체한다.
 */
public interface PaymentGateway {
    PaymentResult charge(PaymentRequest request);
}
