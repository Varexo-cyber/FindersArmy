import "server-only";
import { buildPain001 } from "../../sepa";
import { getSettings } from "../settings";
import { now } from "../clock";
import type { PayoutProvider } from "./provider";

export class SepaFilePayoutProvider implements PayoutProvider {
  name = "sepa-file";

  async prepareBatch({ reference, instructions, executionDate }: Parameters<PayoutProvider["prepareBatch"]>[0]) {
    const { company } = await getSettings();
    const xml = buildPain001({
      messageId: reference,
      createdAt: now(),
      executionDate,
      debtor: { name: company.name, iban: company.iban, bic: company.bic },
      transfers: instructions.map((i) => ({
        endToEndId: `FA-${i.payoutId.slice(-20)}`,
        amountCents: i.amountCents,
        creditorName: i.holder,
        creditorIban: i.iban,
        remittance: i.reference,
      })),
    });
    return { artifact: xml, contentType: "application/xml", filename: `${reference}.xml` };
  }
}
