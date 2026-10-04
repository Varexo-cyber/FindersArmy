import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Bell } from "lucide-react";
import { revalidatePath } from "next/cache";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { requireUser, currentUser } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { cn } from "@/lib/utils";

export default async function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser("/app/meldingen");
  const t = await getTranslations("common");
  const format = await getFormatter();
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });

  async function markAll() {
    "use server";
    const u = await currentUser();
    if (!u) return;
    await db.notification.updateMany({ where: { userId: u.id, readAt: null }, data: { readAt: new Date() } });
    revalidatePath("/", "layout");
  }

  return (
    <>
      <PageHeader
        title={t("notifications")}
        actions={items.some((n) => !n.readAt) ? (
          <form action={markAll}><Button variant="outline" size="sm">{t("markAllRead")}</Button></form>
        ) : null}
      />
      {items.length === 0 ? (
        <EmptyState icon={Bell} title={t("notifications")} body={t("noNotifications")} />
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {items.map((n) => {
            const p = n.payload as { title?: string; url?: string | null };
            const body = (
              <div className="flex items-start gap-3 px-4 py-4">
                <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-signal ring-1 ring-ink/20")} aria-hidden />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className={cn("text-sm", !n.readAt && "font-medium")}>{p.title}</span>
                  <time className="font-mono text-xs text-subtle" dateTime={n.createdAt.toISOString()}>{format.relativeTime(n.createdAt)}</time>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {p.url && p.url.startsWith("/") && !p.url.startsWith("/api/") ? <Link href={p.url} className="block hover:bg-surface-2">{body}</Link> : p.url ? <a href={p.url} className="block hover:bg-surface-2">{body}</a> : body}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
