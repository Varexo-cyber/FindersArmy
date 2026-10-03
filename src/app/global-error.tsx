"use client";

import "./globals.css";
import { ErrorShell } from "@/components/errors/error-shell";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="nl">
      <body>
        <ErrorShell code="500" title="Er ging iets mis aan onze kant." body="We zijn op de hoogte. Probeer het over een paar minuten opnieuw.">
          <button onClick={reset} className="inline-flex h-10 items-center rounded-md bg-signal px-4 text-sm font-medium text-ink">Opnieuw proberen</button>
        </ErrorShell>
      </body>
    </html>
  );
}
