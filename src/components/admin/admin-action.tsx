"use client";

import { useState, useTransition } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Result = { ok: true; message?: string } | { ok: false; error: string };

/**
 * A button that runs a bound server action. With `reason`, the admin must type a reason first:
 * every consequential admin action is audited with a human explanation.
 */
export function AdminAction({
  action,
  label,
  reason,
  extra,
  variant = "outline",
  size = "sm",
}: {
  action: (reason: string, extra?: string) => Promise<Result>;
  label: string;
  reason?: string;
  extra?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [extraText, setExtraText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run() {
    setError(null);
    start(async () => {
      const res = await action(text, extraText || undefined);
      if (!res.ok) setError(res.error);
      else {
        setOpen(false);
        setText("");
      }
    });
  }

  if (!reason) {
    return (
      <span className="inline-flex flex-col gap-1">
        <Button variant={variant} size={size} disabled={pending} onClick={run}>{pending ? "…" : label}</Button>
        {error ? <span role="alert" className="text-xs text-danger">{error}</span> : null}
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col gap-2">
      {!open ? (
        <Button variant={variant} size={size} onClick={() => setOpen(true)}>{label}</Button>
      ) : (
        <span className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3">
          <Input aria-label={reason} placeholder={reason} value={text} onChange={(e) => setText(e.target.value)} autoFocus className="h-9" />
          {extra ? <Input aria-label={extra} placeholder={extra} value={extraText} onChange={(e) => setExtraText(e.target.value)} className="money h-9" /> : null}
          <span className="flex gap-2">
            <Button variant={variant} size="sm" disabled={pending || text.trim().length < 3} onClick={run}>{pending ? "…" : label}</Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Annuleren</Button>
          </span>
          {error ? <span role="alert" className="text-xs text-danger">{error}</span> : null}
        </span>
      )}
    </span>
  );
}
