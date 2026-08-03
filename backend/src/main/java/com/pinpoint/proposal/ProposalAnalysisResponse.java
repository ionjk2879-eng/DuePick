package com.pinpoint.proposal;

import java.time.LocalDate;
import java.util.List;

public record ProposalAnalysisResponse(
    String client,
    String dealType,
    Long amount,
    String currency,
    List<String> deliverables,
    LocalDate draftDueDate,
    LocalDate publishDueDate,
    Integer revisionCount,
    String secondaryUsage,
    String paymentCondition,
    List<String> tasks,
    List<String> risks,
    LocalDate startDate,
    LocalDate endDate,
    List<String> paymentTerms,
    List<String> matchedRules,
    List<String> warnings
) {}
