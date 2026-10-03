import { ErrorShell } from "@/components/errors/error-shell";
import "./globals.css";

export default function RootNotFound() {
  return (
    <html lang="nl">
      <body>
        <ErrorShell code="404" title="Deze pagina bestaat niet." body="Misschien is de link verkeerd overgenomen, of is de pagina verhuisd." />
      </body>
    </html>
  );
}
