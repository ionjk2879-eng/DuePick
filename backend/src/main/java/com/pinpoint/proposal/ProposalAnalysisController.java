package com.pinpoint.proposal;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/proposals")
public class ProposalAnalysisController {
    private final ProposalAnalysisService analysisService;

    public ProposalAnalysisController(ProposalAnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping("/preview")
    public ProposalAnalysisResponse preview(@Valid @RequestBody ProposalAnalysisRequest request) {
        return analysisService.analyze(request.text());
    }
}
