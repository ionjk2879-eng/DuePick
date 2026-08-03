package com.pinpoint.plan;

import com.pinpoint.plan.dto.PlanResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/plans")
public class PlanController {

    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    @GetMapping("/me")
    public PlanResponse myPlan(@AuthenticationPrincipal UserDetails principal) {
        return planService.getMyPlan(principal.getUsername());
    }

    @PostMapping("/upgrade")
    public PlanResponse upgrade(@AuthenticationPrincipal UserDetails principal) {
        return planService.upgradeToPro(principal.getUsername());
    }
}
