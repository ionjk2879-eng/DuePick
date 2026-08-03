package com.pinpoint.deal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record DealCreateRequest(
    String client, String dealType, Long amount, List<String> deliverables,
    LocalDate draftDueDate, LocalDate publishDueDate, Integer revisionCount,
    String secondaryUsage, String paymentCondition, List<String> tasks, List<String> risks,
    @NotBlank @Size(max = 20_000) String rawText
) {
    public DealCreateRequest {
        deliverables = deliverables == null ? List.of() : List.copyOf(deliverables);
        tasks = tasks == null ? List.of() : List.copyOf(tasks);
        risks = risks == null ? List.of() : List.copyOf(risks);
    }
}
