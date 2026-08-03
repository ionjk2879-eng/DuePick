package com.pinpoint.domain.plan;

import com.pinpoint.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_plans")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlanType planType;

    private LocalDateTime expiresAt; // null이면 만료 없음 (FREE 플랜 등)

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

    public UserPlan(User user, PlanType planType, LocalDateTime expiresAt) {
        this.user = user;
        this.planType = planType;
        this.expiresAt = expiresAt;
    }

    public void changePlan(PlanType planType, LocalDateTime expiresAt) {
        this.planType = planType;
        this.expiresAt = expiresAt;
    }

    public boolean isActivePro() {
        return planType == PlanType.PRO && (expiresAt == null || expiresAt.isAfter(LocalDateTime.now()));
    }
}
