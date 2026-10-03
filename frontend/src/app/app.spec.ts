import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { Order, OrderStatus } from './orders/order.model';

function order(id: number, status: OrderStatus): Order {
  return {
    id,
    customerName: `Customer ${id}`,
    customerEmail: `c${id}@example.com`,
    totalAmount: 10.5,
    status,
    createdAt: '2026-01-01T10:00:00Z',
  };
}

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let http: HttpTestingController;
  let el: HTMLElement;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const actionButtons = (row: number) =>
    Array.from(el.querySelectorAll('tbody tr')[row].querySelectorAll<HTMLButtonElement>('button[data-action]')).map(
      (b) => b.dataset['action'],
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(App);
    el = fixture.nativeElement;
  });

  afterEach(() => http.verify());

  it('shows a loading state, then the empty state when there are no orders', async () => {
    await settle();
    expect(el.textContent).toContain('Loading orders');

    http.expectOne('/api/orders').flush([]);
    await settle();

    expect(el.textContent).toContain('No orders yet');
    expect(el.querySelector('table')).toBeNull();
  });

  it('shows an error with retry when loading fails, and recovers on retry', async () => {
    await settle();
    http.expectOne('/api/orders').flush(null, { status: 0, statusText: 'Unknown Error' });
    await settle();
    expect(el.querySelector('[role=alert]')?.textContent).toContain('Cannot reach the server');

    el.querySelector<HTMLButtonElement>('button.retry')!.click();
    http.expectOne('/api/orders').flush([order(1, 'NEW')]);
    await settle();

    expect(el.querySelector('[role=alert]')).toBeNull();
    expect(el.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('offers only valid next transitions for each status', async () => {
    await settle();
    http
      .expectOne('/api/orders')
      .flush([order(1, 'NEW'), order(2, 'PROCESSING'), order(3, 'SHIPPED'), order(4, 'CANCELLED')]);
    await settle();

    expect(actionButtons(0)).toEqual(['PROCESSING', 'CANCELLED']);
    expect(actionButtons(1)).toEqual(['SHIPPED', 'CANCELLED']);
    expect(actionButtons(2)).toEqual([]);
    expect(actionButtons(3)).toEqual([]);
  });

  it('sends a status change and updates the row with the server response', async () => {
    await settle();
    http.expectOne('/api/orders').flush([order(1, 'NEW')]);
    await settle();

    el.querySelector<HTMLButtonElement>('button[data-action=PROCESSING]')!.click();
    const req = http.expectOne('/api/orders/1/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'PROCESSING' });
    req.flush(order(1, 'PROCESSING'));
    await settle();

    expect(el.querySelector('.badge')?.textContent).toContain('PROCESSING');
    expect(actionButtons(0)).toEqual(['SHIPPED', 'CANCELLED']);
  });

  it('shows the backend message when a status change is rejected', async () => {
    await settle();
    http.expectOne('/api/orders').flush([order(1, 'NEW')]);
    await settle();

    el.querySelector<HTMLButtonElement>('button[data-action=CANCELLED]')!.click();
    http
      .expectOne('/api/orders/1/status')
      .flush({ status: 409, message: 'Cannot change status' }, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(el.querySelector('[role=alert]')?.textContent).toContain('Cannot change status');
    expect(el.querySelector('.badge')?.textContent).toContain('NEW');
  });

  describe('create form', () => {
    function fill(name: string, email: string, amount: string) {
      const set = (id: string, value: string) => {
        const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
        input.value = value;
        input.dispatchEvent(new Event('input'));
      };
      set('customerName', name);
      set('customerEmail', email);
      set('totalAmount', amount);
    }

    beforeEach(async () => {
      await settle();
      http.expectOne('/api/orders').flush([]);
      await settle();
    });

    it('does not submit an invalid form and shows validation messages', async () => {
      fill('', 'not-an-email', '');
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      await settle();

      http.expectNone('/api/orders');
      expect(el.querySelectorAll('.field-error').length).toBe(3);
    });

    it('rejects a whitespace-only customer name without posting and shows the validation message', async () => {
      fill('   ', 'ada@example.com', '42.5');
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      await settle();

      http.expectNone('/api/orders');
      const errors = Array.from(el.querySelectorAll('.field-error')).map((e) => e.textContent);
      expect(errors).toEqual(['Customer name is required.']);
    });

    it('posts a valid order, prepends it to the list and clears the form', async () => {
      fill('Ada Lovelace', 'ada@example.com', '42.5');
      el.querySelector('form')!.dispatchEvent(new Event('submit'));

      const req = http.expectOne('/api/orders');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        customerName: 'Ada Lovelace',
        customerEmail: 'ada@example.com',
        totalAmount: 42.5,
      });
      req.flush({ ...order(7, 'NEW'), customerName: 'Ada Lovelace' });
      await settle();

      expect(el.querySelectorAll('tbody tr').length).toBe(1);
      expect(el.querySelector('tbody')!.textContent).toContain('Ada Lovelace');
      expect(el.querySelector<HTMLInputElement>('#customerName')!.value).toBe('');
    });

    it('shows backend validation violations and keeps the entered values', async () => {
      fill('Ada', 'ada@example.com', '1');
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      http
        .expectOne('/api/orders')
        .flush(
          { status: 400, message: 'Validation failed', violations: [{ field: 'customerEmail', message: 'bad' }] },
          { status: 400, statusText: 'Bad Request' },
        );
      await settle();

      expect(el.querySelector('.submit-error')?.textContent).toContain('customerEmail: bad');
      expect(el.querySelector<HTMLInputElement>('#customerName')!.value).toBe('Ada');
    });
  });
});
