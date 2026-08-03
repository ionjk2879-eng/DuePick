package com.pinpoint.report;

import com.pinpoint.domain.subscription.BillingCycle;
import com.pinpoint.domain.subscription.Subscription;
import com.pinpoint.domain.subscription.SubscriptionRepository;
import com.pinpoint.domain.subscription.UsageType;
import com.pinpoint.domain.user.User;
import com.pinpoint.domain.user.UserRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReportService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    public ReportService(SubscriptionRepository subscriptionRepository, UserRepository userRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
    }

    /**
     * 리포트 대상 구독 목록을 조회한다.
     * usageType이 null이면 전체, from/to가 null이면 기간 제한 없음(등록일 기준).
     *
     * ※ 이 리포트는 일반적인 정보 정리용이며, 필요경비 인정 여부를 확정 판정하지 않는다.
     *   최종 신고는 세무사와 상담해야 한다.
     */
    public List<Subscription> getSubscriptions(String email, UsageType usageType, LocalDate from, LocalDate to) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email));

        return subscriptionRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .filter(s -> usageType == null || s.getUsageType() == usageType)
                .filter(s -> from == null || !s.getCreatedAt().toLocalDate().isBefore(from))
                .filter(s -> to == null || !s.getCreatedAt().toLocalDate().isAfter(to))
                .toList();
    }

    /** 연간 환산 없이, 월 환산 금액으로 통일해서 합계를 낸다 (YEARLY는 12로 나눔). */
    public BigDecimal monthlyEquivalentTotal(List<Subscription> subscriptions) {
        return subscriptions.stream()
                .map(this::monthlyEquivalent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal monthlyEquivalent(Subscription s) {
        if (s.getBillingCycle() == BillingCycle.YEARLY) {
            return s.getAmount().divide(BigDecimal.valueOf(12), 0, java.math.RoundingMode.HALF_UP);
        }
        return s.getAmount();
    }

    public byte[] toCsv(List<Subscription> subscriptions) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        // 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM 추가
        try {
            out.write(0xEF);
            out.write(0xBB);
            out.write(0xBF);

            try (OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
                 CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder()
                         .setHeader("서비스명", "금액", "결제주기", "월 환산 금액", "분류", "참고 계정과목", "등록일")
                         .build())) {

                DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                for (Subscription s : subscriptions) {
                    printer.printRecord(
                            s.getServiceName(),
                            s.getAmount(),
                            s.getBillingCycle() == BillingCycle.MONTHLY ? "월간" : "연간",
                            monthlyEquivalent(s),
                            s.getUsageType() == UsageType.BUSINESS ? "업무용" : "개인용",
                            s.getAccountingCategory() == null ? "" : s.getAccountingCategory(),
                            s.getCreatedAt().format(fmt)
                    );
                }
            }
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("CSV 생성 중 오류가 발생했습니다", e);
        }
    }

    public byte[] toPdf(List<Subscription> subscriptions, String nickname) {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            // Standard14Fonts(Helvetica)는 한글 글리프가 없어 "노션", "캔바" 같은 서비스명에서
            // 렌더링 오류가 나므로, 한글을 지원하는 TTF를 임베딩해서 사용한다.
            org.apache.pdfbox.pdmodel.font.PDFont koreanFont;
            try (var fontStream = getClass().getResourceAsStream("/fonts/NanumGothic-Regular.ttf")) {
                if (fontStream == null) {
                    throw new IllegalStateException("한글 폰트 파일을 찾을 수 없습니다: /fonts/NanumGothic-Regular.ttf");
                }
                koreanFont = org.apache.pdfbox.pdmodel.font.PDType0Font.load(document, fontStream);
            }

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                float y = 780;
                float leftMargin = 50;

                content.beginText();
                content.setFont(koreanFont, 16);
                content.newLineAtOffset(leftMargin, y);
                content.showText("구독료 경비 리포트");
                content.endText();
                y -= 22;

                content.beginText();
                content.setFont(koreanFont, 10);
                content.newLineAtOffset(leftMargin, y);
                content.showText(nickname + "님  /  생성일시: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                content.endText();
                y -= 10;

                content.beginText();
                content.setFont(koreanFont, 9);
                content.newLineAtOffset(leftMargin, y);
                content.showText("※ 본 리포트는 일반 정보 제공용이며, 필요경비 인정 여부는 세무사와 최종 확인하시기 바랍니다.");
                content.endText();
                y -= 30;

                // 헤더
                content.beginText();
                content.setFont(koreanFont, 10);
                content.newLineAtOffset(leftMargin, y);
                content.showText(String.format("%-18s %10s %6s %12s %8s", "서비스명", "금액", "주기", "월환산금액", "분류"));
                content.endText();
                y -= 4;
                content.moveTo(leftMargin, y);
                content.lineTo(545, y);
                content.stroke();
                y -= 14;

                for (Subscription s : subscriptions) {
                    if (y < 60) break; // 1페이지 MVP, 다음 단계에서 페이지 넘김 처리
                    content.beginText();
                    content.setFont(koreanFont, 9);
                    content.newLineAtOffset(leftMargin, y);
                    content.showText(String.format("%-18s %10s %6s %12s %8s",
                            truncate(s.getServiceName(), 16),
                            s.getAmount().toPlainString() + "원",
                            s.getBillingCycle() == BillingCycle.MONTHLY ? "월간" : "연간",
                            monthlyEquivalent(s).toPlainString() + "원",
                            s.getUsageType() == UsageType.BUSINESS ? "업무용" : "개인용"
                    ));
                    content.endText();
                    y -= 14;
                }

                y -= 10;
                content.beginText();
                content.setFont(koreanFont, 10);
                content.newLineAtOffset(leftMargin, y);
                content.showText("업무용 구독료 합계 (월 환산 기준): " + monthlyEquivalentTotal(
                        subscriptions.stream().filter(s -> s.getUsageType() == UsageType.BUSINESS).toList()
                ).toPlainString() + "원");
                content.endText();
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("PDF 생성 중 오류가 발생했습니다", e);
        }
    }

    private String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }
}
