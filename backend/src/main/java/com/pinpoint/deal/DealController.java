package com.pinpoint.deal;

import com.pinpoint.deal.dto.DealCreateRequest;
import com.pinpoint.deal.dto.DealResponse;
import com.pinpoint.deal.dto.DealStatusRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/deals")
public class DealController {
    private final DealService dealService;

    public DealController(DealService dealService) { this.dealService = dealService; }

    @GetMapping
    public List<DealResponse> list(@AuthenticationPrincipal UserDetails principal) {
        return dealService.list(principal.getUsername());
    }

    @PostMapping
    public ResponseEntity<DealResponse> create(@AuthenticationPrincipal UserDetails principal,
                                                @Valid @RequestBody DealCreateRequest request) {
        DealResponse response = dealService.create(principal.getUsername(), request);
        return ResponseEntity.created(URI.create("/api/deals/" + response.id())).body(response);
    }

    @PatchMapping("/{id}/status")
    public DealResponse changeStatus(@AuthenticationPrincipal UserDetails principal, @PathVariable Long id,
                                     @Valid @RequestBody DealStatusRequest request) {
        return dealService.changeStatus(principal.getUsername(), id, request.status());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails principal, @PathVariable Long id) {
        dealService.delete(principal.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
