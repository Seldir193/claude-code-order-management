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

const FILTER_OPTIONS: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

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

  /** Active status filter; null means all orders. */
  readonly statusFilter = input<OrderStatus | null>(null);

  readonly filterChange = output<OrderStatus | null>();
  readonly statusChange = output<StatusChange>();
  readonly retry = output<void>();

  protected readonly filterOptions = FILTER_OPTIONS;

  protected onFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterChange.emit(value === '' ? null : (value as OrderStatus));
  }

  protected actionsFor(order: Order): OrderStatus[] {
    return NEXT_STATUSES[order.status];
  }

  protected label(status: OrderStatus): string {
    return ACTION_LABELS[status];
  }
}
