package com.pinpoint.plan;

import com.pinpoint.domain.plan.PlanType;
import com.pinpoint.domain.plan.UserPlan;
import com.pinpoint.domain.plan.UserPlanRepository;
import com.pinpoint.domain.user.User;
import com.pinpoint.domain.user.UserRepository;
import com.pinpoint.payment.PaymentGateway;
import com.pinpoint.payment.PaymentRequest;
import com.pinpoint.payment.PaymentResult;
import com.pinpoint.plan.dto.PlanResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@Transactional
public class PlanService {

    private static final BigDecimal PRO_MONTHLY_PRICE = BigDecimal.valueOf(9900);

    private final UserRepository userRepository;
    private final UserPlanRepository userPlanRepository;
    private final PaymentGateway paymentGateway;

    @Value("${feature.report-plan-restriction-enabled:false}")
    private boolean reportPlanRestrictionEnabled;

    public PlanService(UserRepository userRepository, UserPlanRepository userPlanRepository,
                        PaymentGateway paymentGateway) {
        this.userRepository = userRepository;
        this.userPlanRepository = userPlanRepository;
        this.paymentGateway = paymentGateway;
    }

    public PlanResponse getMyPlan(String email) {
        return toResponse(getOrCreatePlan(loadUser(email)));
    }

    public PlanResponse upgradeToPro(String email) {
        User user = loadUser(email);
        UserPlan plan = getOrCreatePlan(user);

        PaymentResult result = paymentGateway.charge(
                new PaymentRequest(user.getEmail(), PRO_MONTHLY_PRICE, "PRO 플랜 1개월")
        );

        if (!result.success()) {
            throw new IllegalStateException("결제에 실패했습니다: " + result.message());
        }

        plan.changePlan(PlanType.PRO, LocalDateTime.now().plusMonths(1));
        return toResponse(plan);
    }

    /**
     * PRO 플랜 전용 기능 접근을 제한한다. feature.report-plan-restriction-enabled가 꺼져 있으면
     * (기본값 false) 항상 통과시킨다 — 결제 UI가 붙기 전까지 개발을 막지 않기 위함.
     */
    public void requirePro(String email) {
        if (!reportPlanRestrictionEnabled) {
            return;
        }
        if (!getOrCreatePlan(loadUser(email)).isActivePro()) {
            throw new SecurityException("PRO 플랜이 필요한 기능입니다.");
        }
    }

    private UserPlan getOrCreatePlan(User user) {
        return userPlanRepository.findByUser(user)
                .orElseGet(() -> userPlanRepository.save(new UserPlan(user, PlanType.FREE, null)));
    }

    private User loadUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email));
    }

    private PlanResponse toResponse(UserPlan plan) {
        return new PlanResponse(plan.getPlanType().name(), plan.isActivePro(), plan.getExpiresAt());
    }
}
