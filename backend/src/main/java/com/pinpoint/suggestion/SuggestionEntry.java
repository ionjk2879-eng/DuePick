package com.pinpoint.suggestion;

import com.pinpoint.domain.subscription.UsageType;

// 서비스명에 포함된 키워드로 매칭하는 사전 한 줄
record SuggestionEntry(String keyword, UsageType usageType, String accountingCategory) {}
