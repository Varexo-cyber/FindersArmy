import { PageHeader } from "@/components/app/app-shell";
import { SettingEditor } from "@/components/admin/setting-editor";
import { AdminAction } from "@/components/admin/admin-action";
import { Alert } from "@/components/ui/alert";
import { requireAdmin } from "@/lib/server/session";
import { getSettings } from "@/lib/server/settings";
import { db } from "@/lib/server/db";
import { adminToggleCategory } from "@/lib/server/actions/admin";
import type { SettingKey } from "@/lib/settings-schema";

const HELP: Partial<Record<SettingKey, string>> = {
  ranks: "Rangen: minimum betaalde deals en Finder-aandeel in bps (6250 = 62,5%).",
  customerBonusCents: "Cadeaubon voor de klant bij bevestiging, in centen (uit het platformdeel).",
  confirmationDelayDays: "Dagen na WON voordat de klant de bevestigingsmail krijgt.",
  firstDealBonusCents: "Eenmalige bonus bij de eerste betaalde deal, in centen.",
  inviteBonusCents: "Eenmalige bonus voor de uitnodiger, in centen. Strikt één niveau.",
  payoutMinimumCents: "Minimum beschikbaar saldo voor een uitbetaling, in centen.",
  invoiceDueDays: "Betaaltermijn facturen in dagen.",
  invoiceReminderDays: "Dagen na factuurdatum waarop een herinnering gaat.",
  suspendAfterDays: "Na zoveel dagen onbetaald: alle campagnes geschorst.",
  responseHours: "Reactietermijn voor bedrijven op nieuwe aanvragen.",
  attributionMonths: "Hoe lang een klant aan zijn Finder gekoppeld blijft.",
  duplicateWindowDays: "Zelfde klant bij zelfde bedrijf binnen deze termijn = dubbel.",
  anonymizeAfterMonths: "Afgewezen aanvragen worden na zoveel maanden geanonimiseerd.",
  businessReviewScore: "Bedrijfsscore waaronder het bedrijf automatisch naar review gaat.",
  finderWarnScore: "Finder-score waaronder een waarschuwing volgt.",
  finderSuspendScore: "Finder-score waaronder schorsing volgt.",
  countries: "Landen met btw-tarief in bps (2100 = 21%).",
  company: "Bedrijfsgegevens van FindersArmy voor facturen en SEPA-batches.",
};

export default async function AdminSettings() {
  const admin = await requireAdmin();
  const settings = await getSettings();
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  const readOnly = admin.adminRole !== "SUPER_ADMIN";
  return (
    <>
      <PageHeader title="Instellingen" sub="Elke wijziging wordt gevalideerd en vastgelegd in het audit log." />
      {readOnly ? <Alert className="mb-6">Alleen een super admin kan instellingen wijzigen.</Alert> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {(Object.keys(HELP) as SettingKey[]).map((k) => (
          <SettingEditor key={k} k={k} value={settings[k]} help={HELP[k]!} disabled={readOnly} />
        ))}
      </div>
      <h2 className="mt-12 mb-4 text-xl">Categorieën</h2>
      <ul className="divide-y divide-border rounded-md border border-border">
        {categories.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <span className="flex-1 font-medium">{c.nameNl}</span>
            {c.excluded ? <span className="text-xs text-danger">Uitgesloten: {c.excludedReason}</span> : null}
            {!readOnly ? (
              c.excluded ? <AdminAction action={adminToggleCategory.bind(null, c.id, false)} label="Toelaten" /> : <AdminAction action={adminToggleCategory.bind(null, c.id, true)} label="Uitsluiten" reason="Uitleg waarom" variant="ghost" />
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
