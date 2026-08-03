package com.pinpoint.deal;

import com.pinpoint.deal.dto.DealCreateRequest;
import com.pinpoint.deal.dto.DealResponse;
import com.pinpoint.domain.deal.Deal;
import com.pinpoint.domain.deal.DealRepository;
import com.pinpoint.domain.deal.DealStatus;
import com.pinpoint.domain.user.User;
import com.pinpoint.domain.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class DealService {
    private final DealRepository dealRepository;
    private final UserRepository userRepository;

    public DealService(DealRepository dealRepository, UserRepository userRepository) {
        this.dealRepository = dealRepository;
        this.userRepository = userRepository;
    }

    public List<DealResponse> list(String email) {
        return dealRepository.findByUserOrderByCreatedAtDesc(getUser(email)).stream().map(DealResponse::from).toList();
    }

    @Transactional
    public DealResponse create(String email, DealCreateRequest request) {
        Deal deal = new Deal(getUser(email), request.client(), request.dealType(), request.amount(),
            request.deliverables(), request.draftDueDate(), request.publishDueDate(), request.revisionCount(),
            request.secondaryUsage(), request.paymentCondition(), request.tasks(), request.risks(), request.rawText());
        return DealResponse.from(dealRepository.save(deal));
    }

    @Transactional
    public DealResponse changeStatus(String email, Long id, DealStatus status) {
        Deal deal = getOwnedDeal(email, id);
        deal.changeStatus(status);
        return DealResponse.from(deal);
    }

    @Transactional
    public void delete(String email, Long id) {
        dealRepository.delete(getOwnedDeal(email, id));
    }

    private Deal getOwnedDeal(String email, Long id) {
        Deal deal = dealRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("거래를 찾을 수 없습니다: " + id));
        if (!deal.getUser().getEmail().equals(email)) throw new SecurityException("본인 소유의 거래만 변경할 수 있습니다.");
        return deal;
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email));
    }
}
