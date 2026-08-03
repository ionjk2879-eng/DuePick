package com.pinpoint.proposal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProposalAnalysisRequest(
    @NotBlank(message = "제안 내용을 입력해 주세요.")
    @Size(max = 20_000, message = "제안 내용은 20,000자 이하여야 합니다.") String text
) {}
