"use client";

import { useState, useTransition } from "react";
import { adminUpdateSetting } from "@/lib/server/actions/admin";
import type { SettingKey } from "@/lib/settings-schema";
import { Button } from "@/components/ui/button";

/**
 * Settings are edited as JSON and validated server-side against the same Zod schema the app
 * reads them with. Amounts are in cents, percentages in basis points (6250 = 62,5%).
 */
export function SettingEditor({ k, value, help, disabled }: { k: SettingKey; value: unknown; help: string; disabled: boolean }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={`s-${k}`} className="font-mono text-sm font-medium">{k}</label>
        <span className="text-xs text-subtle">{help}</span>
      </div>
      <textarea
        id={`s-${k}`}
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        rows={Math.min(14, text.split("\n").length + 1)}
        className="w-full rounded-md border border-border bg-bg p-2 font-mono text-xs"
        spellCheck={false}
      />
      <div className="flex items-center gap-3">
        <Button size="sm" variant="solid" disabled={pending || disabled} onClick={() => start(async () => { const r = await adminUpdateSetting(k, text); setMsg(r.ok ? "Opgeslagen." : r.error); })}>Opslaan</Button>
        {msg ? <span role="status" className="text-xs">{msg}</span> : null}
      </div>
    </div>
  );
}
