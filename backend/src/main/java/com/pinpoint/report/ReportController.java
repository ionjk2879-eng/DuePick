package com.pinpoint.report;

import com.pinpoint.domain.subscription.Subscription;
import com.pinpoint.domain.subscription.UsageType;
import com.pinpoint.plan.PlanService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports/subscriptions")
public class ReportController {

    private final ReportService reportService;
    private final PlanService planService;

    public ReportController(ReportService reportService, PlanService planService) {
        this.reportService = reportService;
        this.planService = planService;
    }

    @GetMapping("/csv")
    public ResponseEntity<ByteArrayResource> downloadCsv(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(required = false) UsageType usageType,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        planService.requirePro(principal.getUsername());
        List<Subscription> subscriptions = reportService.getSubscriptions(principal.getUsername(), usageType, from, to);
        byte[] csv = reportService.toCsv(subscriptions);
        return fileResponse(csv, "subscriptions-report.csv", "text/csv; charset=UTF-8");
    }

    @GetMapping("/pdf")
    public ResponseEntity<ByteArrayResource> downloadPdf(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(required = false) UsageType usageType,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        planService.requirePro(principal.getUsername());
        List<Subscription> subscriptions = reportService.getSubscriptions(principal.getUsername(), usageType, from, to);
        byte[] pdf = reportService.toPdf(subscriptions, principal.getUsername());
        return fileResponse(pdf, "subscriptions-report.pdf", "application/pdf");
    }

    private ResponseEntity<ByteArrayResource> fileResponse(byte[] bytes, String filename, String contentType) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }
}
