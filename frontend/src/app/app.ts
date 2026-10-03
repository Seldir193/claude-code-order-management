import { Component, inject, signal } from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { OrderApiService, describeApiError } from './orders/order-api.service';
import { OrderForm } from './orders/order-form';
import { OrderList, StatusChange } from './orders/order-list';
import { Order, OrderStatus } from './orders/order.model';

@Component({
  selector: 'app-root',
  imports: [OrderForm, OrderList],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly api = inject(OrderApiService);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly busyOrderId = signal<number | null>(null);
  protected readonly statusFilter = signal<OrderStatus | null>(null);
  private loadRequest?: Subscription;

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadRequest?.unsubscribe();
    this.loadRequest = this.api
      .list(this.statusFilter() ?? undefined)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
        },
        error: (err) => {
          this.error.set(describeApiError(err));
        },
      });
  }

  protected onFilterChange(status: OrderStatus | null): void {
    this.statusFilter.set(status);
    this.load();
  }

  protected onCreated(order: Order): void {
    if (this.matchesFilter(order)) {
      this.orders.update((orders) => [order, ...orders]);
    }
  }

  protected onStatusChange({ order, status }: StatusChange): void {
    this.busyOrderId.set(order.id);
    this.error.set(null);
    this.api
      .changeStatus(order.id, status)
      .pipe(finalize(() => this.busyOrderId.set(null)))
      .subscribe({
        next: (updated) => {
          this.orders.update((orders) =>
            orders.flatMap((o) => (o.id !== updated.id ? [o] : this.matchesFilter(updated) ? [updated] : [])),
          );
        },
        error: (err) => {
          this.error.set(describeApiError(err));
        },
      });
  }

  private matchesFilter(order: Order): boolean {
    const filter = this.statusFilter();
    return filter === null || order.status === filter;
  }
}
