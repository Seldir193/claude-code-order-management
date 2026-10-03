package com.example.orders.order;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class OrderService {

    private final OrderRepository repository;
    private final Clock clock;

    public OrderService(OrderRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public OrderResponse create(CreateOrderRequest request) {
        Order order = new Order(
                request.customerName().trim(),
                request.customerEmail().trim(),
                request.totalAmount(),
                Instant.now(clock));
        return OrderResponse.from(repository.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> list() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt", "id")).stream()
                .map(OrderResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse get(Long id) {
        return OrderResponse.from(find(id));
    }

    public OrderResponse changeStatus(Long id, OrderStatus target) {
        Order order = find(id);
        if (!order.getStatus().canTransitionTo(target)) {
            throw new InvalidStatusTransitionException(order.getStatus(), target);
        }
        order.setStatus(target);
        return OrderResponse.from(order);
    }

    private Order find(Long id) {
        return repository.findById(id).orElseThrow(() -> new OrderNotFoundException(id));
    }
}
