import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { PageHero, Section, SectionHeading } from "@/components/marketing/section";
import { PIPELINE } from "@/lib/lead-status";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata((await params).locale, "how", "/hoe-het-werkt");
}

export default async function HowPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("how");
  const ts = await getTranslations("status");
  const tl = await getTranslations("statusLong");
  const columns = [
    { title: t("findersTitle"), steps: t.raw("findersSteps") as string[] },
    { title: t("customerTitle"), steps: t.raw("customerSteps") as string[] },
    { title: t("businessTitle"), steps: t.raw("businessSteps") as string[] },
  ];
  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} sub={t("sub")} />
      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {columns.map((c) => (
            <div key={c.title} className="flex flex-col rounded-md border border-border">
              <h2 className="border-b border-border px-5 py-4 text-2xl">{c.title}</h2>
              <ol className="flex flex-col">
                {c.steps.map((s, i) => (
                  <li key={s} className="flex gap-4 border-b border-border px-5 py-4 last:border-0">
                    <span className="font-mono text-sm text-subtle">0{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Section>
      <Section tone="surface">
        <SectionHeading title={t("pipelineTitle")} sub={t("pipelineSub")} />
        <ol className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3 lg:grid-cols-9">
          {PIPELINE.map((s, i) => (
            <li key={s} className="flex flex-col gap-3 bg-bg p-4">
              <span className="font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</span>
              <Badge tone={s === "PAID" || s === "PAID_OUT" ? "signal" : "olive"}>{ts(s)}</Badge>
              <span className="text-sm text-subtle">{tl(s)}</span>
            </li>
          ))}
        </ol>
      </Section>
      <Section>
        <div className="grid gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl md:text-4xl">{t("moneyTitle")}</h2>
            <p className="leading-relaxed text-subtle">{t("moneyBody")}</p>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl md:text-4xl">{t("fairTitle")}</h2>
            <ul className="flex flex-col border-t border-border">
              {[t("fair1"), t("fair2"), t("fair3"), t("fair4"), t("fair5")].map((f) => (
                <li key={f} className="border-b border-border py-3">{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
