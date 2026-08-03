package com.pinpoint.domain.deal;

import com.pinpoint.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "deals")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Deal {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    private String client;
    private String dealType;
    private Long amount;
    private LocalDate draftDueDate;
    private LocalDate publishDueDate;
    private Integer revisionCount;
    private String secondaryUsage;
    private String paymentCondition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DealStatus status;

    @Lob @Column(nullable = false)
    private String rawText;

    @ElementCollection
    @CollectionTable(name = "deal_deliverables", joinColumns = @JoinColumn(name = "deal_id"))
    @Column(name = "deliverable")
    private List<String> deliverables = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "deal_tasks", joinColumns = @JoinColumn(name = "deal_id"))
    @Column(name = "task")
    private List<String> tasks = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "deal_risks", joinColumns = @JoinColumn(name = "deal_id"))
    @Column(name = "risk")
    private List<String> risks = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Deal(User user, String client, String dealType, Long amount, List<String> deliverables,
                LocalDate draftDueDate, LocalDate publishDueDate, Integer revisionCount,
                String secondaryUsage, String paymentCondition, List<String> tasks,
                List<String> risks, String rawText) {
        this.user = user;
        this.client = client;
        this.dealType = dealType;
        this.amount = amount;
        this.deliverables.addAll(deliverables);
        this.draftDueDate = draftDueDate;
        this.publishDueDate = publishDueDate;
        this.revisionCount = revisionCount;
        this.secondaryUsage = secondaryUsage;
        this.paymentCondition = paymentCondition;
        this.tasks.addAll(tasks);
        this.risks.addAll(risks);
        this.rawText = rawText;
        this.status = DealStatus.REVIEW;
    }

    public void changeStatus(DealStatus status) { this.status = status; }

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
