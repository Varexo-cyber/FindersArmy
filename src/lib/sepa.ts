/**
 * SEPA Credit Transfer initiation, ISO 20022 pain.001.001.03 — the format Dutch business banks
 * (ING, Rabobank, ABN AMRO, Bunq, Knab) accept for batch uploads.
 */
import { isValidIban, normalizeIban } from "./iban";

export interface SepaDebtor {
  name: string;
  iban: string;
  bic?: string | null;
}

export interface SepaTransfer {
  endToEndId: string;
  amountCents: number;
  creditorName: string;
  creditorIban: string;
  remittance: string;
}

export interface SepaBatchInput {
  messageId: string;
  createdAt: Date;
  executionDate: Date;
  debtor: SepaDebtor;
  transfers: SepaTransfer[];
}

const DIACRITICS = /[̀-ͯ]/g;

/** Reduce text to the SEPA Latin character set; banks reject anything else. */
export function sepaText(input: string, max: number): string {
  const ascii = input
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(/[ß]/g, "ss")
    .replace(/[&]/g, "+")
    .replace(/[^A-Za-z0-9/\-?:().,'+ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return ascii.slice(0, max);
}

function sepaId(input: string): string {
  const id = input.replace(/[^A-Za-z0-9/\-?:().,'+]/g, "").slice(0, 35);
  if (!id) throw new Error("Empty SEPA identifier");
  return id;
}

function amount(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error(`Invalid transfer amount ${cents}`);
  return (cents / 100).toFixed(2);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function isoDateTime(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "");
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const BIC_RE = /^[A-Z]{6}[A-Z2-9][A-NP-Z0-9]([A-Z0-9]{3})?$/;

export function buildPain001(input: SepaBatchInput): string {
  if (input.transfers.length === 0) throw new Error("A SEPA batch needs at least one transfer");
  if (!isValidIban(input.debtor.iban)) throw new Error("Debtor IBAN is invalid");
  for (const t of input.transfers) {
    if (!isValidIban(t.creditorIban)) throw new Error(`Creditor IBAN invalid for ${t.endToEndId}`);
  }
  const ctrlSumCents = input.transfers.reduce((acc, t) => acc + t.amountCents, 0);
  const n = String(input.transfers.length);
  const ctrl = amount(ctrlSumCents);
  const debtorName = escapeXml(sepaText(input.debtor.name, 70));
  const bic = input.debtor.bic?.toUpperCase().replace(/\s/g, "");
  const debtorAgent =
    bic && BIC_RE.test(bic) ? `<BIC>${bic}</BIC>` : "<Othr><Id>NOTPROVIDED</Id></Othr>";

  const txs = input.transfers
    .map(
      (t) => `
      <CdtTrfTxInf>
        <PmtId><EndToEndId>${escapeXml(sepaId(t.endToEndId))}</EndToEndId></PmtId>
        <Amt><InstdAmt Ccy="EUR">${amount(t.amountCents)}</InstdAmt></Amt>
        <Cdtr><Nm>${escapeXml(sepaText(t.creditorName, 70))}</Nm></Cdtr>
        <CdtrAcct><Id><IBAN>${normalizeIban(t.creditorIban)}</IBAN></Id></CdtrAcct>
        <RmtInf><Ustrd>${escapeXml(sepaText(t.remittance, 140))}</Ustrd></RmtInf>
      </CdtTrfTxInf>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${escapeXml(sepaId(input.messageId))}</MsgId>
      <CreDtTm>${isoDateTime(input.createdAt)}</CreDtTm>
      <NbOfTxs>${n}</NbOfTxs>
      <CtrlSum>${ctrl}</CtrlSum>
      <InitgPty><Nm>${debtorName}</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${escapeXml(sepaId(`${input.messageId}-1`))}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${n}</NbOfTxs>
      <CtrlSum>${ctrl}</CtrlSum>
      <PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl></PmtTpInf>
      <ReqdExctnDt>${isoDate(input.executionDate)}</ReqdExctnDt>
      <Dbtr><Nm>${debtorName}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>${normalizeIban(input.debtor.iban)}</IBAN></Id></DbtrAcct>
      <DbtrAgt><FinInstnId>${debtorAgent}</FinInstnId></DbtrAgt>
      <ChrgBr>SLEV</ChrgBr>${txs}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>
`;
}
