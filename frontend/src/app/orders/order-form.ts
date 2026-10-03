import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrderApiService, describeApiError } from './order-api.service';
import { Order } from './order.model';

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule],
  templateUrl: './order-form.html',
  styleUrl: './order-form.scss',
})
export class OrderForm {
  private readonly api = inject(OrderApiService);

  readonly created = output<Order>();

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).group({
    customerName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    customerEmail: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    totalAmount: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { customerName, customerEmail, totalAmount } = this.form.getRawValue();
    this.submitting.set(true);
    this.submitError.set(null);
    this.api
      .create({
        customerName: (customerName ?? '').trim(),
        customerEmail: (customerEmail ?? '').trim(),
        totalAmount: totalAmount!,
      })
      .subscribe({
        next: (order) => {
          this.submitting.set(false);
          this.form.reset();
          this.created.emit(order);
        },
        error: (err) => {
          this.submitting.set(false);
          this.submitError.set(describeApiError(err));
        },
      });
  }

  protected showError(name: 'customerName' | 'customerEmail' | 'totalAmount'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }
}
