import "server-only";
import createMollieClient, { PaymentMethod, type MollieClient } from "@mollie/api-client";
import type { CreatePaymentInput, PaymentProvider, PaymentState } from "./provider";

export class MolliePaymentProvider implements PaymentProvider {
  name = "mollie";
  private client: MollieClient;

  constructor(apiKey: string) {
    this.client = createMollieClient({ apiKey });
  }

  async createPayment(input: CreatePaymentInput) {
    const payment = await this.client.payments.create({
      amount: { currency: "EUR", value: (input.amountCents / 100).toFixed(2) },
      description: input.description,
      redirectUrl: input.redirectUrl,
      // Mollie cannot reach localhost; webhooks only work on a public URL (use a tunnel locally).
      webhookUrl: input.webhookUrl.includes("localhost") ? undefined : input.webhookUrl,
      method: [PaymentMethod.ideal, PaymentMethod.bancontact, PaymentMethod.creditcard],
      metadata: { invoiceId: input.invoiceId },
    });
    const checkoutUrl = payment.getCheckoutUrl();
    if (!checkoutUrl) throw new Error("Mollie returned no checkout URL");
    return { id: payment.id, checkoutUrl };
  }

  async getPaymentState(id: string) {
    const payment = await this.client.payments.get(id);
    const metadata = payment.metadata as { invoiceId?: string } | null;
    return { state: payment.status as PaymentState, invoiceId: metadata?.invoiceId ?? null };
  }
}
