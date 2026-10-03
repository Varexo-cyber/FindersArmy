import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { ErrorShell } from "@/components/errors/error-shell";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <ErrorShell code="404" title={t("notFoundTitle")} body={t("notFoundBody")}>
      <Link href="/" className={buttonVariants({ variant: "primary" })}>{t("home")}</Link>
    </ErrorShell>
  );
}
