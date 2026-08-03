package com.pinpoint.subscription;

import com.pinpoint.domain.subscription.BillingCycle;
import com.pinpoint.domain.subscription.Subscription;
import com.pinpoint.domain.subscription.SubscriptionRepository;
import com.pinpoint.domain.subscription.UsageType;
import com.pinpoint.domain.user.User;
import com.pinpoint.domain.user.UserRepository;
import com.pinpoint.subscription.dto.CategoryTotal;
import com.pinpoint.subscription.dto.MonthlyCount;
import com.pinpoint.subscription.dto.SubscriptionRequest;
import com.pinpoint.subscription.dto.SubscriptionResponse;
import com.pinpoint.subscription.dto.SummaryResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository, UserRepository userRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
    }

    public List<SubscriptionResponse> getMySubscriptions(String email) {
        User user = getUser(email);
        return subscriptionRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(SubscriptionResponse::from)
                .toList();
    }

    public SummaryResponse getSummary(String email) {
        User user = getUser(email);
        List<Subscription> all = subscriptionRepository.findByUserOrderByCreatedAtDesc(user);

        BigDecimal businessTotal = monthlyEquivalentTotal(
                all.stream().filter(s -> s.getUsageType() == UsageType.BUSINESS).toList());
        BigDecimal personalTotal = monthlyEquivalentTotal(
                all.stream().filter(s -> s.getUsageType() == UsageType.PERSONAL).toList());

        List<CategoryTotal> byCategory = all.stream()
                .filter(s -> s.getUsageType() == UsageType.BUSINESS)
                .collect(java.util.stream.Collectors.groupingBy(
                        s -> s.getAccountingCategory() == null || s.getAccountingCategory().isBlank()
                                ? "미분류" : s.getAccountingCategory(),
                        LinkedHashMap::new,
                        java.util.stream.Collectors.reducing(BigDecimal.ZERO, this::monthlyEquivalent, BigDecimal::add)
                ))
                .entrySet().stream()
                .map(e -> new CategoryTotal(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(CategoryTotal::monthlyTotal).reversed())
                .toList();

        List<MonthlyCount> trend = buildRegistrationTrend(all);

        return new SummaryResponse(businessTotal, personalTotal, byCategory, trend);
    }

    /** 최근 6개월(이번 달 포함) 등록 건수 추이. 데이터 없는 달도 0으로 채워서 반환한다. */
    private List<MonthlyCount> buildRegistrationTrend(List<Subscription> all) {
        DateTimeFormatter keyFormat = DateTimeFormatter.ofPattern("yyyy-MM");
        Map<String, Long> countByMonth = all.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        s -> YearMonth.from(s.getCreatedAt()).format(keyFormat),
                        java.util.stream.Collectors.counting()
                ));

        YearMonth current = YearMonth.from(LocalDate.now());
        return java.util.stream.IntStream.rangeClosed(0, 5)
                .mapToObj(current::minusMonths)
                .sorted()
                .map(ym -> {
                    String key = ym.format(keyFormat);
                    return new MonthlyCount(key, countByMonth.getOrDefault(key, 0L));
                })
                .toList();
    }

    private BigDecimal monthlyEquivalentTotal(List<Subscription> subscriptions) {
        return subscriptions.stream()
                .map(this::monthlyEquivalent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal monthlyEquivalent(Subscription s) {
        if (s.getBillingCycle() == BillingCycle.YEARLY) {
            return s.getAmount().divide(BigDecimal.valueOf(12), 0, RoundingMode.HALF_UP);
        }
        return s.getAmount();
    }

    @Transactional
    public SubscriptionResponse create(String email, SubscriptionRequest request) {
        User user = getUser(email);
        Subscription subscription = new Subscription(
                user, request.serviceName(), request.amount(),
                request.billingCycle(), request.usageType(), request.accountingCategory()
        );
        return SubscriptionResponse.from(subscriptionRepository.save(subscription));
    }

    @Transactional
    public SubscriptionResponse update(String email, Long id, SubscriptionRequest request) {
        Subscription subscription = getOwnedSubscription(email, id);
        subscription.update(
                request.serviceName(), request.amount(), request.billingCycle(),
                request.usageType(), request.accountingCategory()
        );
        return SubscriptionResponse.from(subscription);
    }

    @Transactional
    public void delete(String email, Long id) {
        Subscription subscription = getOwnedSubscription(email, id);
        subscriptionRepository.delete(subscription);
    }

    private Subscription getOwnedSubscription(String email, Long id) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("구독 정보를 찾을 수 없습니다: " + id));

        if (!subscription.getUser().getEmail().equals(email)) {
            throw new SecurityException("본인 소유의 구독만 수정/삭제할 수 있습니다");
        }
        return subscription;
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email));
    }
}
