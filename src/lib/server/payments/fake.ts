import "server-only";
import { db } from "../db";
import { appUrl } from "../../env";
import type { CreatePaymentInput, PaymentProvider } from "./provider";

/**
 * Local stand-in for Mollie. The "checkout" is a page in this app (/api/dev/checkout) that marks
 * the payment paid and then calls the real webhook handler, exercising the same code path.
 * State is kept in the Setting table so it survives dev-server reloads.
 */
export class FakePaymentProvider implements PaymentProvider {
  name = "fake";

  async createPayment(input: CreatePaymentInput) {
    const id = `tr_fake_${input.invoiceId}_${Date.now().toString(36)}`;
    await db.setting.upsert({
      where: { key: `fakepay:${id}` },
      create: { key: `fakepay:${id}`, value: { state: "open", invoiceId: input.invoiceId, redirectUrl: input.redirectUrl } },
      update: {},
    });
    return { id, checkoutUrl: appUrl(`/api/dev/checkout?id=${encodeURIComponent(id)}`) };
  }

  async getPaymentState(id: string) {
    const row = await db.setting.findUnique({ where: { key: `fakepay:${id}` } });
    if (!row) throw new Error(`Unknown fake payment ${id}`);
    const v = row.value as { state: "open" | "paid"; invoiceId: string };
    return { state: v.state, invoiceId: v.invoiceId };
  }
}
