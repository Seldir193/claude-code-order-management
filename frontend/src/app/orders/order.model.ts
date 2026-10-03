export type OrderStatus = 'NEW' | 'PROCESSING' | 'SHIPPED' | 'CANCELLED';

export interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  totalAmount: number;
}

export interface FieldViolation {
  field: string;
  message: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  violations?: FieldViolation[];
}

/** Mirrors the backend transition rules; SHIPPED and CANCELLED are final. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: [],
  CANCELLED: [],
};
