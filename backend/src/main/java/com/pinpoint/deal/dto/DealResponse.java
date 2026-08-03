package com.pinpoint.deal.dto;

import com.pinpoint.domain.deal.Deal;
import com.pinpoint.domain.deal.DealStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record DealResponse(Long id, String client, String dealType, Long amount, List<String> deliverables,
                           LocalDate draftDueDate, LocalDate publishDueDate, Integer revisionCount,
                           String secondaryUsage, String paymentCondition, List<String> tasks,
                           List<String> risks, DealStatus status, String rawText,
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
    public static DealResponse from(Deal deal) {
        return new DealResponse(deal.getId(), deal.getClient(), deal.getDealType(), deal.getAmount(),
            List.copyOf(deal.getDeliverables()), deal.getDraftDueDate(), deal.getPublishDueDate(),
            deal.getRevisionCount(), deal.getSecondaryUsage(), deal.getPaymentCondition(),
            List.copyOf(deal.getTasks()), List.copyOf(deal.getRisks()), deal.getStatus(),
            deal.getRawText(), deal.getCreatedAt(), deal.getUpdatedAt());
    }
}
