# FindersArmy

**Je kent iemand. Verdien eraan.** Een platform dat mensen die een klant kennen (Finders) koppelt aan lokale bedrijven. Bedrijven betalen alleen een finder's fee als een aangebrachte klant echt klant wordt.

- `findersarmy.com`: internationaal. Nederlands staat op `/`, Engels op `/en`.
- `finderarmy.nl`: redirect (308) naar de Nederlandse versie op `findersarmy.com`.

## Stack

Next.js 15 (App Router, Server Components, Server Actions) · TypeScript strict · Tailwind CSS v4 met eigen design system · PostgreSQL + Prisma · Auth.js v5 (magic link + Google) · Mollie · Resend + React Email · next-intl · Zod + React Hook Form · pdf-lib · Vitest · Playwright

## In 15 minuten lokaal draaien

Je hebt Node 22+, pnpm 10+ en PostgreSQL 15+ nodig.

```bash
# 1. Dependencies
pnpm install

# 2. Environment
cp .env.example .env
#    Vul minimaal DATABASE_URL, AUTH_SECRET, HASH_SALT en CRON_SECRET in.
#    Laat PAYMENT_PROVIDER="fake" en RESEND_API_KEY leeg voor lokaal werk.

# 3. Database
createdb findersarmy            # of via je eigen Postgres-tool
pnpm db:migrate                 # past de migraties toe
pnpm db:seed                    # fictieve demodata (bedrijven eindigen op "(demo)")

# 4. Starten
pnpm dev                        # http://localhost:3000
```

### Inloggen lokaal

Er zijn geen wachtwoorden. Vraag op `/login` een inloglink aan en open daarna de **dev-mailbox** op <http://localhost:3000/api/dev/mail>. Daar komen alle e-mails binnen zolang `RESEND_API_KEY` leeg is.

| Rol | E-mail |
|---|---|
| Super admin | `admin@findersarmy.test` |
| Support-admin | `support@findersarmy.test` |
| Bedrijf (Schildersbedrijf Kwast & Co (demo)) | `bedrijf1@findersarmy.test` |
| Finder met IBAN | `finder1@findersarmy.test` |

Demo-referrallink: <http://localhost:3000/r/demo10>.

## Environment-variabelen

Alles staat met uitleg in [`.env.example`](.env.example). De app valideert de environment bij eerste gebruik (`src/lib/env.ts`) en weigert te starten met `PAYMENT_PROVIDER=fake` of zonder `RESEND_API_KEY` in productie.

Optionele koppelingen hebben een veilige lokale fallback:

| Koppeling | Zonder configuratie |
|---|---|
| Resend | dev-mailbox (`/api/dev/mail`) |
| Mollie | `fake`-provider: een testcheckout die de echte webhook aanroept |
| Cloudflare R2 | bestanden in de database (`StoredFile`) |
| Upstash Redis | rate limiting in geheugen (alleen geschikt voor één instantie) |
| Google OAuth | knop verborgen, alleen magic link |
| Anthropic (`ANTHROPIC_API_KEY`) | hulp-chat zoekt zelf in de site-kennis en verwijst naar de juiste pagina |

## Tests

```bash
pnpm test              # Vitest: fees, staffels, minimums, boosts, rangen, grootboek, btw, IBAN, SEPA (tegen de officiële XSD), schema's, vertalingen
pnpm lint
pnpm typecheck

# End-to-end (Playwright, mobiel 375px, tegen een productie-build)
createdb findersarmy_test
pnpm build
pnpm test:e2e          # migreert + seedt findersarmy_test, start `next start` op :3100 en draait de suite
```

De e2e-suite dekt de vijf kernflows:

1. Bedrijf meldt zich aan → admin keurt goed → campagne live
2. Finder meldt zich aan → deelt link (WhatsApp, kopiëren, QR)
3. Klant opent link → doet aanvraag (plus checks op dubbele aanvragen en zelf-aanbrengen)
4. Bedrijf zet lead op WON met bedrag → klant bevestigt → factuur + PDF → betaling (Mollie-testmodus) → webhook
5. Finder ziet saldo beschikbaar → vraagt uitbetaling aan → admin keurt goed → SEPA pain.001-batch → uitbetaald

Daarnaast is er een layouttest: geen enkele pagina scrollt horizontaal op 375px.

De e2e-server draait met `E2E=1`. Alleen dan accepteert `/api/cron/daily?offsetDays=N` gesimuleerde tijd (om de bevestigingsmail na 14 dagen te testen) en zijn de dev-mailbox en de fake-checkout beschikbaar in een productie-build. **Zet `E2E` nooit in een echte omgeving.**

Gebruik je de Chromium van het systeem in plaats van `playwright install`? Zet dan `PW_CHROMIUM_PATH=/pad/naar/chrome`.

## Mollie testmodus

1. Maak een Mollie-account en kopieer de **test**-API-sleutel (`test_…`).
2. Zet `PAYMENT_PROVIDER="mollie"` en `MOLLIE_API_KEY="test_…"`.
3. Mollie kan `localhost` niet bereiken voor webhooks. Gebruik een tunnel (bijv. `cloudflared tunnel --url http://localhost:3000`) en zet `APP_URL` op de tunnel-URL.
4. Bevestig een deal. Op de factuur staat een Mollie-betaallink. In de testcheckout kies je "Paid", Mollie roept `/api/webhooks/mollie` aan en de factuur, lead en Finder-saldo worden bijgewerkt.

De webhook vertrouwt alleen het `id` uit de request en haalt de werkelijke status altijd zelf op bij Mollie.

## Deployen naar Vercel

1. Importeer de repository in Vercel (framework: Next.js).
2. Maak een PostgreSQL-database (Neon, Supabase, Vercel Postgres) en zet `DATABASE_URL`.
3. Zet alle variabelen uit `.env.example`, met `APP_URL` en `AUTH_URL` op `https://findersarmy.com`. `APP_URL` wordt ook bij de build gebruikt (canonical-URL's, OG-afbeeldingen, sitemap).
4. Build command: `prisma migrate deploy && pnpm build` (of draai `pnpm db:deploy` apart vóór elke release).
5. Domeinen: koppel `findersarmy.com` als primair domein en `finderarmy.nl` (+ `www`). De middleware stuurt `finderarmy.nl` met een 308 door naar de Nederlandse versie.
6. `vercel.json` plant dagelijks `/api/cron/daily` (herinneringen, klantbevestigingen, factuurherinneringen + schorsing, budget-reset, scores, anonimisering). Vercel stuurt `CRON_SECRET` mee.
7. Zet Upstash Redis aan voor rate limiting over meerdere instanties.
8. Maak de eerste admin: log één keer in met je e-mailadres en zet daarna in de database `roles = {ADMIN}` en `adminRole = SUPER_ADMIN` voor die gebruiker.

## Architectuur

```
prisma/              schema, migraties, seed
src/app/[locale]/    (marketing) · (auth) login + aanmelden · (customer) r/[code] + bevestig/[token] · app/finder · app/bedrijf · admin
src/app/api/         auth · webhooks/mollie · cron/daily · files · PDF's · SEPA-export · og · dev-mailbox/checkout
src/lib/             pure domeinlogica: fees, ranks, ledger, vat, iban, sepa, lead-status, scores, age, money
src/lib/server/      services (leads, invoices, payouts, scores, jobs), providers (payments, payouts, storage, mail), actions
src/emails/          React Email-layout
messages/            nl.json, en.json
tests/unit · tests/e2e
```

### Spelregels die in de code zijn vastgelegd

- **Geld is altijd een integer in centen.** Percentages zijn basispunten (`6250` = 62,5%). Er wordt één keer afgerond, half-away-from-zero (`src/lib/money.ts`).
- **Het saldo is altijd de som van het grootboek** (`LedgerEntry`), nooit een overschrijfbaar veld (`src/lib/ledger.ts`).
- **Geen piramide.** De uitnodigingsbonus wordt eenmalig betaald, op één niveau, bij de eerste betaalde deal van de genodigde (`markInvoicePaid`).
- **Fee-berekening** zit in een pure functie (`src/lib/fees.ts`): onder het minimum klusbedrag geen fee (ook geen boost), een minimum fee, de boost wordt vastgelegd op het moment dat de lead binnenkomt, en de klantbonus wordt zo afgetopt dat het platformdeel nooit negatief wordt.
- **Attributie:** cookie van 90 dagen; de eerste link voor dezelfde campagne wint. Een klant blijft 12 maanden aan de oorspronkelijke Finder gekoppeld. Dezelfde klant bij hetzelfde bedrijf binnen 90 dagen wordt `DUPLICATE`.
- **Fraude:** zelf aanbrengen via eigen e-mail of telefoon wordt geweigerd. Een aanvraag vanaf een apparaat (gehasht IP) van de Finder zelf wordt `FRAUD` en gaat naar de admin-wachtrij. Er zijn rate limits en een honeypot.
- **Privacy:** een Finder ziet van klanten alleen voornaam en woonplaats. IP-adressen worden alleen gehasht opgeslagen. Afgewezen aanvragen worden na 12 maanden automatisch geanonimiseerd. Gebruikers kunnen hun gegevens exporteren en hun account verwijderen.
- **Uitbetalingen** lopen via een `PayoutProvider`-interface. Fase 1 is een SEPA pain.001.001.03-bestand, gevalideerd tegen de officiële ISO-XSD in de tests. Stripe Connect of Mollie Connect kan later dezelfde interface implementeren.
- **Notificaties** lopen via kanalen (in-app + e-mail). WhatsApp of SMS is een extra `Channel` in `src/lib/server/notify.ts`.

## Hulp-chat (rechtsonder)

Op elke pagina staat een hulp-chat. De kennis wordt opgebouwd uit dezelfde bronnen als de website zelf (`src/lib/assistant/knowledge.ts`): alle paginateksten uit `messages/*.json`, de FAQ, alle categorieën met rekenvoorbeelden, en live uit de database de rangen, bonussen, termijnen en live campagnes. Pas je de site aan, dan weet de chat het meteen; er is niets dubbel te onderhouden.

- Met `ANTHROPIC_API_KEY` antwoordt Claude (model via `ASSISTANT_MODEL`, standaard `claude-opus-5-5`, met automatische terugval bij overbelasting). Voor vragen over belasting, KvK of privacy mag hij zoeken op belastingdienst.nl, kvk.nl, rijksoverheid.nl, autoriteitpersoonsgegevens.nl en consuwijzer.nl. De vaste site-kennis wordt gecachet, zodat een vraag weinig kost.
- Zonder sleutel zoekt de chat zelf in dezelfde kennis en toont de relevante passage met een link.
- Rate limit: 30 vragen per 10 minuten per (gehasht) IP. Gesprekken worden niet opgeslagen; de geschiedenis staat alleen in de browser-sessie.

## Open punten voor de eigenaar

Deze punten staan ook als checklist op het admin-dashboard:

- Met een boekhouder afstemmen hoe uitbetalingen aan particulieren fiscaal worden gemeld. Het datamodel (`Payout`, `LedgerEntry`, `FinderProfile`) is uitbreidbaar met extra velden.
- Juridische teksten laten controleren. Alle voorwaarden, de privacy- en de cookieverklaring zijn concepten en tonen die waarschuwing bovenaan.
- Bedrijfsgegevens van FindersArmy (KvK, btw, IBAN, BIC) invullen bij Admin › Instellingen › `company`. De seed vult demowaarden in.
- Mollie live zetten, verwerkersovereenkomsten afsluiten en een leverancier voor de cadeaubonnen kiezen.

## Bekende beperkingen

- De Mollie-koppeling is geschreven tegen de officiële `@mollie/api-client` en end-to-end getest via de `fake`-provider (dezelfde webhook-route en dezelfde betaalflow), maar nog niet tegen een echt Mollie-testaccount. Volg de stappen onder *Mollie testmodus*.
- Lighthouse (mobiel, gesimuleerd 4G): accessibility, best practices en SEO scoren 100 op alle publieke pagina's. Performance schommelt tussen 94 en 97 per meting (LCP 2,5–2,9 s gesimuleerd).
- De admin is bewust alleen Nederlandstalig (intern team). Alle publieke pagina's, de Finder-app, de bedrijfsapp en de e-mails zijn er in NL en EN.
