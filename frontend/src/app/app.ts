import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { OrderApiService, describeApiError } from './orders/order-api.service';
import { OrderForm } from './orders/order-form';
import { OrderList, StatusChange } from './orders/order-list';
import { Order } from './orders/order.model';

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

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list()
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

  protected onCreated(order: Order): void {
    this.orders.update((orders) => [order, ...orders]);
  }

  protected onStatusChange({ order, status }: StatusChange): void {
    this.busyOrderId.set(order.id);
    this.error.set(null);
    this.api
      .changeStatus(order.id, status)
      .pipe(finalize(() => this.busyOrderId.set(null)))
      .subscribe({
        next: (updated) => {
          this.orders.update((orders) => orders.map((o) => (o.id === updated.id ? updated : o)));
        },
        error: (err) => {
          this.error.set(describeApiError(err));
        },
      });
  }
}
