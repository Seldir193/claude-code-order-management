import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { NEXT_STATUSES, Order, OrderStatus } from './order.model';

export interface StatusChange {
  order: Order;
  status: OrderStatus;
}

const ACTION_LABELS: Record<OrderStatus, string> = {
  NEW: 'New',
  PROCESSING: 'Process',
  SHIPPED: 'Ship',
  CANCELLED: 'Cancel',
};

@Component({
  selector: 'app-order-list',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderList {
  readonly orders = input.required<Order[]>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  /** Id of the order whose status change is in flight, if any. */
  readonly busyOrderId = input<number | null>(null);

  readonly statusChange = output<StatusChange>();
  readonly retry = output<void>();

  protected actionsFor(order: Order): OrderStatus[] {
    return NEXT_STATUSES[order.status];
  }

  protected label(status: OrderStatus): string {
    return ACTION_LABELS[status];
  }
}
