import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero, Section } from "@/components/marketing/section";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata((await params).locale, "contact", "/contact");
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const rows = [
    [t("emailLabel"), t("email")],
    [t("businessLabel"), t("businessEmail")],
    [t("invoicesLabel"), t("invoicesEmail")],
    [t("privacyLabel"), t("privacyEmail")],
  ];
  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} />
      <Section>
        <dl className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2">
          {rows.map(([label, email]) => (
            <div key={label} data-spot className="flex flex-col gap-2 bg-bg p-6 transition-colors duration-150 hover:bg-surface">
              <dt className="eyebrow">{label}</dt>
              <dd>
                <a href={`mailto:${email}`} className="font-mono text-lg underline-offset-4 hover:underline">{email}</a>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 max-w-2xl text-subtle">{t("note")}</p>
      </Section>
    </>
  );
}
