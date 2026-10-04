"use client";

import { useState, useTransition } from "react";
import { adminUpdateLead } from "@/lib/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { LEAD_STATUSES } from "@/lib/lead-status";

const ADMIN_TARGETS = LEAD_STATUSES.filter((s) => !["INVOICED", "PAID", "PAID_OUT"].includes(s));

/** Admin status correction: reason is mandatory and lands in the event log and audit log. */
export function LeadAdminForm({ leadId, current }: { leadId: string; current: string }) {
  const [to, setTo] = useState(current === "FRAUD" ? "NEW" : "CONFIRMED");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await adminUpdateLead({ leadId, to, reason, dealAmount: amount || undefined });
          setMsg(res.ok ? "Opgeslagen." : `Fout: ${res.error}`);
        });
      }}
    >
      <Field label="Nieuwe status" htmlFor="a-to">
        <Select id="a-to" value={to} onChange={(e) => setTo(e.target.value)}>
          {ADMIN_TARGETS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </Field>
      <Field label="Dealbedrag (optioneel, excl. btw)" htmlFor="a-amount">
        <Input id="a-amount" className="money" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="bijv. 3.250" />
      </Field>
      <Field label="Reden (verplicht)" htmlFor="a-reason">
        <Input id="a-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <Button type="submit" variant="solid" size="sm" disabled={pending || reason.trim().length < 3} className="self-start">Status corrigeren</Button>
      {msg ? <p role="status" className="text-sm">{msg}</p> : null}
    </form>
  );
}
