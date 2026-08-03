package com.pinpoint.proposal;

import org.springframework.stereotype.Service;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ProposalAnalysisService {
    private static final Pattern WON_AMOUNT = Pattern.compile("(?:금액|예산|보수|대금|총액|견적)?\\s*[:：]?\\s*(?:₩|KRW)?\\s*([0-9][0-9,]*(?:\\.[0-9]+)?)\\s*(만원|천원|원|KRW)", Pattern.CASE_INSENSITIVE);
    private static final Pattern DATE = Pattern.compile("(20\\d{2})[.\\-/년]\\s*(\\d{1,2})[.\\-/월]\\s*(\\d{1,2})(?:일)?");
    private static final Pattern DATE_RANGE = Pattern.compile("(20\\d{2}[.\\-/년]\\s*\\d{1,2}[.\\-/월]\\s*\\d{1,2}(?:일)?)\\s*(?:~|～|부터|에서|-)\\s*(20\\d{2}[.\\-/년]\\s*\\d{1,2}[.\\-/월]\\s*\\d{1,2}(?:일)?)");
    private static final Pattern PERCENT = Pattern.compile("(선금|착수금|중도금|잔금)\\s*([0-9]{1,3})\\s*%");
    private static final Pattern DAYS_AFTER = Pattern.compile("(검수|납품|세금계산서\\s*발행)\\s*(?:후|완료\\s*후)?\\s*(\\d{1,3})\\s*일\\s*(?:이내|후)?");
    private static final Pattern CLIENT = Pattern.compile("(?:거래처|브랜드|광고주|클라이언트)\\s*[:：]\\s*([^\\n,]{1,60})");
    private static final Pattern DELIVERABLE = Pattern.compile("(유튜브\\s*영상|쇼츠|릴스|인스타그램\\s*게시물|블로그\\s*포스팅|영상|게시물)\\s*(\\d+)\\s*건", Pattern.CASE_INSENSITIVE);
    private static final Pattern MONTH_DAY = Pattern.compile("(\\d{1,2})월\\s*(\\d{1,2})일");
    private static final Pattern DRAFT_DATE = Pattern.compile("초안[^\\n.]{0,30}?(\\d{1,2})월\\s*(\\d{1,2})일");
    private static final Pattern PUBLISH_DATE = Pattern.compile("(?:게시|업로드)[^\\n.]{0,30}?(\\d{1,2})월\\s*(\\d{1,2})일|(\\d{1,2})월\\s*(\\d{1,2})일까지[^\\n.]{0,40}(?:영상|쇼츠|릴스|게시)");
    private static final Pattern SECONDARY_USAGE = Pattern.compile("2차\\s*활용(?:\\s*기간)?(?:은|는|:|：)?\\s*(\\d+\\s*(?:개월|년))");
    private static final Pattern REVISION = Pattern.compile("수정(?:\\s*가능)?(?:은|는|:|：)?\\s*(\\d+)\\s*회");

    public ProposalAnalysisResponse analyze(String rawText) {
        String text = rawText.replace('\u00a0', ' ').trim();
        List<String> rules = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        List<String> risks = new ArrayList<>();
        String client = findGroup(CLIENT, text, 1);
        if (client != null) rules.add("거래처 표현"); else warnings.add("거래처를 찾지 못했습니다.");
        String dealType = findDealType(text);
        if (dealType != null) rules.add("채널·제안 유형");
        List<String> deliverables = findDeliverables(text);
        if (!deliverables.isEmpty()) rules.add("작업물 수량"); else warnings.add("작업 범위를 찾지 못했습니다.");
        Long amount = findAmount(text);
        if (amount != null) rules.add("금액 표현"); else warnings.add("금액을 찾지 못했습니다.");

        LocalDate startDate = null;
        LocalDate endDate = null;
        Matcher range = DATE_RANGE.matcher(text);
        if (range.find()) {
            startDate = parseDate(range.group(1));
            endDate = parseDate(range.group(2));
            if (startDate != null && endDate != null) rules.add("날짜 범위");
        } else {
            List<LocalDate> dates = findDates(text);
            if (!dates.isEmpty()) {
                startDate = dates.get(0);
                endDate = dates.size() > 1 ? dates.get(1) : null;
                rules.add("날짜 표현");
            }
        }
        if (startDate == null && endDate == null) warnings.add("프로젝트 날짜를 찾지 못했습니다.");
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) warnings.add("종료일이 시작일보다 빠릅니다.");

        int inferredYear = startDate != null ? startDate.getYear() : LocalDate.now().getYear();
        LocalDate draftDueDate = findContextDate(DRAFT_DATE, text, inferredYear);
        LocalDate publishDueDate = findPublishDate(text, inferredYear);
        if (draftDueDate != null || publishDueDate != null) rules.add("초안·게시 납기");
        String secondaryUsage = findGroup(SECONDARY_USAGE, text, 1);
        if (secondaryUsage != null) rules.add("2차 활용 기간");
        Integer revisionCount = findInteger(REVISION, text);
        if (revisionCount != null) rules.add("수정 횟수"); else risks.add("수정 횟수가 명시되지 않음");

        Set<String> terms = new LinkedHashSet<>();
        Matcher percent = PERCENT.matcher(text);
        while (percent.find()) terms.add(percent.group(1) + " " + percent.group(2) + "%");
        Matcher days = DAYS_AFTER.matcher(text);
        while (days.find()) terms.add(days.group(1).replaceAll("\\s+", " ") + " 후 " + days.group(2) + "일 이내");
        if (text.contains("월말 지급")) terms.add("월말 지급");
        if (text.contains("익월 지급") || text.contains("다음 달 지급")) terms.add("익월 지급");
        if (text.contains("게시 후 익월 말")) terms.add("게시 후 익월 말");
        if (!terms.isEmpty()) rules.add("지급 조건"); else warnings.add("지급 조건을 찾지 못했습니다.");
        String paymentCondition = terms.isEmpty() ? null : String.join(" · ", terms);
        if (text.contains("원천세 포함")) risks.add("원천세 포함 금액인지 실수령액 확인 필요");
        if (secondaryUsage == null) risks.add("2차 활용 조건이 명시되지 않음");
        if (paymentCondition == null) risks.add("입금 조건이 명시되지 않음");

        List<String> tasks = new ArrayList<>();
        deliverables.forEach(item -> tasks.add(item + " 제작"));
        if (draftDueDate != null) tasks.add(draftDueDate + "까지 초안 전달");
        if (publishDueDate != null) tasks.add(publishDueDate + "까지 게시");
        if (paymentCondition != null) tasks.add("입금 예정일 확인: " + paymentCondition);

        return new ProposalAnalysisResponse(client, dealType, amount, amount == null ? null : "KRW",
            deliverables, draftDueDate, publishDueDate, revisionCount, secondaryUsage, paymentCondition,
            List.copyOf(tasks), List.copyOf(risks), startDate, endDate, List.copyOf(terms),
            List.copyOf(rules), List.copyOf(warnings));
    }

    private String findDealType(String text) {
        if (text.contains("유튜브") || text.contains("쇼츠")) return "유튜브 협찬";
        if (text.contains("인스타그램") || text.contains("릴스")) return "인스타그램 협찬";
        if (text.contains("블로그")) return "블로그 광고";
        if (text.contains("광고")) return "광고";
        if (text.contains("외주")) return "외주";
        return null;
    }

    private List<String> findDeliverables(String text) {
        Set<String> values = new LinkedHashSet<>();
        Matcher matcher = DELIVERABLE.matcher(text);
        while (matcher.find()) values.add(matcher.group(1).replaceAll("\\s+", " ") + " " + matcher.group(2) + "건");
        return List.copyOf(values);
    }

    private String findGroup(Pattern pattern, String text, int group) {
        Matcher matcher = pattern.matcher(text);
        return matcher.find() ? matcher.group(group).trim() : null;
    }

    private Integer findInteger(Pattern pattern, String text) {
        String value = findGroup(pattern, text, 1);
        return value == null ? null : Integer.parseInt(value);
    }

    private LocalDate findContextDate(Pattern pattern, String text, int year) {
        Matcher matcher = pattern.matcher(text);
        return matcher.find() ? safeDate(year, Integer.parseInt(matcher.group(1)), Integer.parseInt(matcher.group(2))) : null;
    }

    private LocalDate findPublishDate(String text, int year) {
        Matcher matcher = PUBLISH_DATE.matcher(text);
        if (matcher.find()) {
            String month = matcher.group(1) != null ? matcher.group(1) : matcher.group(3);
            String day = matcher.group(2) != null ? matcher.group(2) : matcher.group(4);
            return safeDate(year, Integer.parseInt(month), Integer.parseInt(day));
        }
        Matcher fallback = MONTH_DAY.matcher(text);
        return fallback.find() ? safeDate(year, Integer.parseInt(fallback.group(1)), Integer.parseInt(fallback.group(2))) : null;
    }

    private LocalDate safeDate(int year, int month, int day) {
        try { return LocalDate.of(year, month, day); } catch (DateTimeException ignored) { return null; }
    }

    private Long findAmount(String text) {
        Matcher matcher = WON_AMOUNT.matcher(text);
        Long best = null;
        while (matcher.find()) {
            double number = Double.parseDouble(matcher.group(1).replace(",", ""));
            String unit = matcher.group(2).toLowerCase(Locale.ROOT);
            long multiplier = unit.equals("만원") ? 10_000L : unit.equals("천원") ? 1_000L : 1L;
            long value = Math.round(number * multiplier);
            if (best == null || value > best) best = value;
        }
        return best;
    }

    private List<LocalDate> findDates(String text) {
        List<LocalDate> dates = new ArrayList<>();
        Matcher matcher = DATE.matcher(text);
        while (matcher.find()) {
            LocalDate date = parseDate(matcher.group());
            if (date != null) dates.add(date);
        }
        return dates;
    }

    private LocalDate parseDate(String value) {
        Matcher matcher = DATE.matcher(value);
        if (!matcher.find()) return null;
        try {
            return LocalDate.of(Integer.parseInt(matcher.group(1)), Integer.parseInt(matcher.group(2)), Integer.parseInt(matcher.group(3)));
        } catch (DateTimeException ignored) {
            return null;
        }
    }
}
