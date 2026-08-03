package com.pinpoint.subscription;

import com.pinpoint.subscription.dto.SubscriptionRequest;
import com.pinpoint.subscription.dto.SubscriptionResponse;
import com.pinpoint.subscription.dto.SummaryResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public List<SubscriptionResponse> list(@AuthenticationPrincipal UserDetails principal) {
        return subscriptionService.getMySubscriptions(principal.getUsername());
    }

    @GetMapping("/summary")
    public SummaryResponse summary(@AuthenticationPrincipal UserDetails principal) {
        return subscriptionService.getSummary(principal.getUsername());
    }

    @PostMapping
    public ResponseEntity<SubscriptionResponse> create(@AuthenticationPrincipal UserDetails principal,
                                                         @Valid @RequestBody SubscriptionRequest request) {
        return ResponseEntity.ok(subscriptionService.create(principal.getUsername(), request));
    }

    @PutMapping("/{id}")
    public SubscriptionResponse update(@AuthenticationPrincipal UserDetails principal,
                                        @PathVariable Long id,
                                        @Valid @RequestBody SubscriptionRequest request) {
        return subscriptionService.update(principal.getUsername(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails principal, @PathVariable Long id) {
        subscriptionService.delete(principal.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
