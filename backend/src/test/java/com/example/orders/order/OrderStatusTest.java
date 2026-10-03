package com.example.orders.order;

import static com.example.orders.order.OrderStatus.CANCELLED;
import static com.example.orders.order.OrderStatus.NEW;
import static com.example.orders.order.OrderStatus.PROCESSING;
import static com.example.orders.order.OrderStatus.SHIPPED;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class OrderStatusTest {

    @Test
    void newOrderCanBeProcessedOrCancelled() {
        assertThat(NEW.canTransitionTo(PROCESSING)).isTrue();
        assertThat(NEW.canTransitionTo(CANCELLED)).isTrue();
        assertThat(NEW.canTransitionTo(SHIPPED)).isFalse();
    }

    @Test
    void processingOrderCanBeShippedOrCancelled() {
        assertThat(PROCESSING.canTransitionTo(SHIPPED)).isTrue();
        assertThat(PROCESSING.canTransitionTo(CANCELLED)).isTrue();
        assertThat(PROCESSING.canTransitionTo(NEW)).isFalse();
    }

    @Test
    void shippedAndCancelledAreTerminal() {
        for (OrderStatus target : OrderStatus.values()) {
            assertThat(SHIPPED.canTransitionTo(target)).isFalse();
            assertThat(CANCELLED.canTransitionTo(target)).isFalse();
        }
    }
}
