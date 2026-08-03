package com.pinpoint.domain.subscription;

import com.pinpoint.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String serviceName; // 예: "Canva", "Notion"

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BillingCycle billingCycle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UsageType usageType; // 업무용 / 개인용

    private String accountingCategory; // 참고용 계정과목 (예: "지급수수료") — 확정 판정 아님, 일반 정보 제공 수준

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Subscription(User user, String serviceName, BigDecimal amount,
                         BillingCycle billingCycle, UsageType usageType, String accountingCategory) {
        this.user = user;
        this.serviceName = serviceName;
        this.amount = amount;
        this.billingCycle = billingCycle;
        this.usageType = usageType;
        this.accountingCategory = accountingCategory;
    }

    public void update(String serviceName, BigDecimal amount, BillingCycle billingCycle,
                        UsageType usageType, String accountingCategory) {
        this.serviceName = serviceName;
        this.amount = amount;
        this.billingCycle = billingCycle;
        this.usageType = usageType;
        this.accountingCategory = accountingCategory;
    }
}
