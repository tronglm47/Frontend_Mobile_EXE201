import { api } from '../utils/api';

export type PaymentCreateBody = {
  userId?: number;
  amount: number;
  paymentType: string; // e.g., 'payos'
  subscriptionPlanId: number;
  description?: string;
};

export type PaymentCreateResponse = {
  paymentId?: number | string;
  checkoutUrl?: string;
  qrCodeUrl?: string;
  status?: string;
};

// POST /api/Payment/create
export async function createPayment(body: PaymentCreateBody): Promise<PaymentCreateResponse> {
  return await api.post<PaymentCreateResponse>('Payment/create', body, true);
}


