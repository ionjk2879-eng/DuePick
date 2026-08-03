package com.pinpoint.subscription.dto;

import java.math.BigDecimal;
import java.util.List;

public record SummaryResponse(
        BigDecimal businessMonthlyTotal,
        BigDecimal personalMonthlyTotal,
        List<CategoryTotal> byAccountingCategory, // 업무용만 집계 (참고용 계정과목별 합계)
        List<MonthlyCount> registrationTrend       // 최근 6개월 등록 추이
) {}
