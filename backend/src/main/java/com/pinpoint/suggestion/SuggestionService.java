package com.pinpoint.suggestion;

import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class SuggestionService {

    /**
     * 서비스명에 사전 키워드가 포함되어 있으면 첫 매칭 결과를 반환한다.
     * 매칭이 여러 개일 수 있으므로, 더 긴(구체적인) 키워드를 우선한다.
     */
    public SuggestionResponse suggest(String serviceName) {
        if (serviceName == null || serviceName.isBlank()) {
            return SuggestionResponse.unmatched();
        }

        String normalized = serviceName.toLowerCase(Locale.ROOT);

        return SubscriptionDictionary.ENTRIES.stream()
                .filter(entry -> normalized.contains(entry.keyword().toLowerCase(Locale.ROOT)))
                .max((a, b) -> Integer.compare(a.keyword().length(), b.keyword().length()))
                .map(entry -> SuggestionResponse.matched(entry.usageType(), entry.accountingCategory()))
                .orElseGet(SuggestionResponse::unmatched);
    }
}
