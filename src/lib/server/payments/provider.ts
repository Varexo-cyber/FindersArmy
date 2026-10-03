import "server-only";

export type PaymentState = "open" | "pending" | "paid" | "failed" | "canceled" | "expired";

export interface CreatePaymentInput {
  amountCents: number;
  description: string;
  invoiceId: string;
  redirectUrl: string;
  webhookUrl: string;
}

/**
 * Collects payments from businesses. Mollie in production; `FakePaymentProvider` for local
 * development and e2e tests, where it simulates a checkout page and calls our webhook.
 */
export interface PaymentProvider {
  name: string;
  createPayment(input: CreatePaymentInput): Promise<{ id: string; checkoutUrl: string }>;
  getPaymentState(id: string): Promise<{ state: PaymentState; invoiceId: string | null }>;
}
