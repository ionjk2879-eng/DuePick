package com.pinpoint.suggestion;

import com.pinpoint.domain.subscription.UsageType;

import java.util.List;

import static com.pinpoint.domain.subscription.UsageType.BUSINESS;
import static com.pinpoint.domain.subscription.UsageType.PERSONAL;

/**
 * 서비스명 키워드 → (업무/개인 분류, 참고 계정과목) 매핑 사전.
 *
 * 확정 판정이 아니라 "일반적으로 이렇게 분류되는 경향이 있다"는 참고 정보 제공 수준으로 유지한다.
 * (세무 자문 경계를 넘지 않기 위해, "100% 인정됩니다" 같은 단정적 문구는 절대 쓰지 않는다)
 */
final class SubscriptionDictionary {

    static final List<SuggestionEntry> ENTRIES = List.of(
            // 생산성 / 협업 도구 — 업무용, 지급수수료로 분류되는 경우가 흔함
            new SuggestionEntry("notion", BUSINESS, "지급수수료"),
            new SuggestionEntry("노션", BUSINESS, "지급수수료"),
            new SuggestionEntry("slack", BUSINESS, "지급수수료"),
            new SuggestionEntry("zoom", BUSINESS, "통신비"),
            new SuggestionEntry("google workspace", BUSINESS, "지급수수료"),
            new SuggestionEntry("구글 워크스페이스", BUSINESS, "지급수수료"),
            new SuggestionEntry("dropbox", BUSINESS, "지급수수료"),
            new SuggestionEntry("드롭박스", BUSINESS, "지급수수료"),
            new SuggestionEntry("github", BUSINESS, "지급수수료"),

            // 디자인 / 영상 도구
            new SuggestionEntry("canva", BUSINESS, "지급수수료"),
            new SuggestionEntry("캔바", BUSINESS, "지급수수료"),
            new SuggestionEntry("figma", BUSINESS, "지급수수료"),
            new SuggestionEntry("피그마", BUSINESS, "지급수수료"),
            new SuggestionEntry("adobe", BUSINESS, "지급수수료"),
            new SuggestionEntry("어도비", BUSINESS, "지급수수료"),
            new SuggestionEntry("premiere", BUSINESS, "지급수수료"),
            new SuggestionEntry("capcut", BUSINESS, "지급수수료"),
            new SuggestionEntry("캡컷", BUSINESS, "지급수수료"),

            // AI 도구
            new SuggestionEntry("chatgpt", BUSINESS, "지급수수료"),
            new SuggestionEntry("claude", BUSINESS, "지급수수료"),
            new SuggestionEntry("클로드", BUSINESS, "지급수수료"),
            new SuggestionEntry("gemini", BUSINESS, "지급수수료"),
            new SuggestionEntry("미드저니", BUSINESS, "지급수수료"),
            new SuggestionEntry("midjourney", BUSINESS, "지급수수료"),

            // 엔터테인먼트 — 개인용, 참고 계정과목 없음
            new SuggestionEntry("netflix", PERSONAL, null),
            new SuggestionEntry("넷플릭스", PERSONAL, null),
            new SuggestionEntry("유튜브 프리미엄", PERSONAL, null),
            new SuggestionEntry("youtube premium", PERSONAL, null),
            new SuggestionEntry("spotify", PERSONAL, null),
            new SuggestionEntry("스포티파이", PERSONAL, null),
            new SuggestionEntry("멜론", PERSONAL, null),
            new SuggestionEntry("지니뮤직", PERSONAL, null),
            new SuggestionEntry("disney", PERSONAL, null),
            new SuggestionEntry("디즈니", PERSONAL, null),
            new SuggestionEntry("왓챠", PERSONAL, null),
            new SuggestionEntry("watcha", PERSONAL, null),
            new SuggestionEntry("쿠팡플레이", PERSONAL, null),
            new SuggestionEntry("티빙", PERSONAL, null),
            new SuggestionEntry("웨이브", PERSONAL, null)
    );

    private SubscriptionDictionary() {}
}
