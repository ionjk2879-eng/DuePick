package com.pinpoint.proposal;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class ProposalAnalysisServiceTest {
    private final ProposalAnalysisService service = new ProposalAnalysisService();

    @Test
    void extractsAmountDateRangeAndPaymentTerms() {
        ProposalAnalysisResponse result = service.analyze("""
            브랜드: A 브랜드
            유튜브 영상 1건
            총 예산 350만원
            기간 2026-08-10 ~ 2026-09-20
            착수금 30%, 잔금 70%, 검수 후 14일 이내 지급
            """);

        assertThat(result.amount()).isEqualTo(3_500_000L);
        assertThat(result.startDate()).isEqualTo(LocalDate.of(2026, 8, 10));
        assertThat(result.endDate()).isEqualTo(LocalDate.of(2026, 9, 20));
        assertThat(result.paymentTerms()).containsExactly("착수금 30%", "잔금 70%", "검수 후 14일 이내");
        assertThat(result.warnings()).isEmpty();
    }

    @Test
    void returnsWarningsInsteadOfGuessingMissingValues() {
        ProposalAnalysisResponse result = service.analyze("간단한 소개 페이지 제작을 제안합니다.");

        assertThat(result.amount()).isNull();
        assertThat(result.startDate()).isNull();
        assertThat(result.paymentTerms()).isEmpty();
        assertThat(result.warnings()).contains("거래처를 찾지 못했습니다.", "작업 범위를 찾지 못했습니다.",
            "금액을 찾지 못했습니다.", "프로젝트 날짜를 찾지 못했습니다.", "지급 조건을 찾지 못했습니다.");
    }

    @Test
    void structuresKoreanSponsorshipEmail() {
        ProposalAnalysisResponse result = service.analyze("""
            브랜드: A 브랜드
            8월 20일까지 유튜브 영상 1건과 쇼츠 2건 부탁드립니다.
            초안은 8월 14일까지 전달 부탁드리며, 2차 활용은 3개월입니다.
            비용은 원천세 포함 150만원이고 게시 후 익월 말 지급입니다.
            """);

        assertThat(result.client()).isEqualTo("A 브랜드");
        assertThat(result.dealType()).isEqualTo("유튜브 협찬");
        assertThat(result.amount()).isEqualTo(1_500_000L);
        assertThat(result.deliverables()).containsExactly("유튜브 영상 1건", "쇼츠 2건");
        assertThat(result.draftDueDate()).hasDayOfMonth(14);
        assertThat(result.publishDueDate()).hasDayOfMonth(20);
        assertThat(result.secondaryUsage()).isEqualTo("3개월");
        assertThat(result.paymentCondition()).contains("게시 후 익월 말");
        assertThat(result.risks()).contains("원천세 포함 금액인지 실수령액 확인 필요", "수정 횟수가 명시되지 않음");
    }
}
