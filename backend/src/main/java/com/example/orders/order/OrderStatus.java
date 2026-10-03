package com.example.orders.order;

import java.util.Set;

public enum OrderStatus {
    NEW,
    PROCESSING,
    SHIPPED,
    CANCELLED;

    public boolean canTransitionTo(OrderStatus target) {
        return allowedTargets().contains(target);
    }

    private Set<OrderStatus> allowedTargets() {
        return switch (this) {
            case NEW -> Set.of(PROCESSING, CANCELLED);
            case PROCESSING -> Set.of(SHIPPED, CANCELLED);
            case SHIPPED, CANCELLED -> Set.of();
        };
    }
}
