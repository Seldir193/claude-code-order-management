package com.example.orders.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    private static final Instant NOW = Instant.parse("2025-01-15T10:00:00Z");

    @Mock
    private OrderRepository repository;

    private OrderService service;

    @BeforeEach
    void setUp() {
        service = new OrderService(repository, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void createStartsInNewStatusWithCurrentUtcTimestamp() {
        when(repository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse response = service.create(
                new CreateOrderRequest("  Ada Lovelace ", "ada@example.com", new BigDecimal("19.99")));

        assertThat(response.status()).isEqualTo(OrderStatus.NEW);
        assertThat(response.createdAt()).isEqualTo(NOW);
        assertThat(response.customerName()).isEqualTo("Ada Lovelace");
        assertThat(response.totalAmount()).isEqualByComparingTo("19.99");
    }

    @Test
    void getUnknownOrderThrowsNotFound() {
        when(repository.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(42L)).isInstanceOf(OrderNotFoundException.class);
    }

    @Test
    void changeStatusAppliesAllowedTransition() {
        Order order = new Order("Ada", "ada@example.com", BigDecimal.TEN, NOW);
        when(repository.findById(1L)).thenReturn(Optional.of(order));

        OrderResponse response = service.changeStatus(1L, OrderStatus.PROCESSING);

        assertThat(response.status()).isEqualTo(OrderStatus.PROCESSING);
    }

    @Test
    void changeStatusRejectsForbiddenTransition() {
        Order order = new Order("Ada", "ada@example.com", BigDecimal.TEN, NOW);
        when(repository.findById(1L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.changeStatus(1L, OrderStatus.SHIPPED))
                .isInstanceOf(InvalidStatusTransitionException.class);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.NEW);
    }
}
