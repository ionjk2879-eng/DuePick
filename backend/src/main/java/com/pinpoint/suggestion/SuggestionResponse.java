package com.pinpoint.suggestion;

import com.pinpoint.domain.subscription.UsageType;

public record SuggestionResponse(
        boolean matched,
        UsageType suggestedUsageType,
        String suggestedAccountingCategory,
        String note
) {
    static SuggestionResponse matched(UsageType usageType, String accountingCategory) {
        return new SuggestionResponse(
                true, usageType, accountingCategory,
                "일반적인 분류 사례를 참고한 추천입니다. 실제 업무 사용 여부에 맞게 최종 확인해주세요."
        );
    }

    static SuggestionResponse unmatched() {
        return new SuggestionResponse(
                false, null, null,
                "등록된 사전에 없는 서비스입니다. 업무용/개인용 여부를 직접 선택해주세요."
        );
    }
}
