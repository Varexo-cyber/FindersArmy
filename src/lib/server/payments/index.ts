import "server-only";
import { env } from "../../env";
import { FakePaymentProvider } from "./fake";
import { MolliePaymentProvider } from "./mollie";
import type { PaymentProvider } from "./provider";

let instance: PaymentProvider | null = null;

export function payments(): PaymentProvider {
  if (instance) return instance;
  const e = env();
  if (e.PAYMENT_PROVIDER === "fake") {
    instance = new FakePaymentProvider();
  } else {
    if (!e.MOLLIE_API_KEY) throw new Error("MOLLIE_API_KEY is required when PAYMENT_PROVIDER=mollie");
    instance = new MolliePaymentProvider(e.MOLLIE_API_KEY);
  }
  return instance;
}
