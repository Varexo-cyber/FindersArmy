import { notFound } from "next/navigation";

// Catch-all so unknown paths render the localised 404 inside the locale layout.
export default function CatchAll() {
  notFound();
}
