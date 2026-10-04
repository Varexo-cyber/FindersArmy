"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyField({ value, label, copyLabel, copiedLabel }: { value: string; label: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2.5">
        <span className="flex-1 truncate font-mono text-sm">{value}</span>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium"
          onClick={async () => {
            await navigator.clipboard.writeText(value).catch(() => undefined);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
        >
          {copied ? <><Check aria-hidden className="size-4" />{copiedLabel}</> : <><Copy aria-hidden className="size-4" />{copyLabel}</>}
        </button>
      </div>
    </div>
  );
}
