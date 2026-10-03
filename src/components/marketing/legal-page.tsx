import { getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";

export async function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  const t = await getTranslations("common");
  return (
    <div className="container-x py-14 md:py-20">
      <div role="note" className="mb-10 flex items-center gap-3 rounded-md border border-danger/50 bg-danger/5 px-4 py-3 text-sm font-medium">
        <AlertTriangle aria-hidden className="size-4 shrink-0 text-danger" />
        {t("concept")}
      </div>
      <h1 className="mb-8 max-w-3xl text-4xl md:text-6xl">{title}</h1>
      <article className="prose-legal max-w-3xl">{children}</article>
    </div>
  );
}
