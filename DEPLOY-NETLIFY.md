# FindersArmy op Netlify zetten

## 1. Site aanmaken
1. Netlify → **Add new site → Import an existing project → GitHub** → kies `Varexo-cyber/FindersArmy`.
2. Netlify leest `netlify.toml`: build command `bash scripts/netlify-build.sh`. Niets aanpassen.

## 2. Environment variables (Site configuration → Environment variables)

| Naam | Waarde |
|---|---|
| `DATABASE_URL` | je Neon connection string (de `-pooler` variant) |
| `AUTH_SECRET` | lange willekeurige tekst (minimaal 32 tekens) |
| `AUTH_TRUST_HOST` | `true` |
| `HASH_SALT` | lange willekeurige tekst |
| `CRON_SECRET` | lange willekeurige tekst |
| `APP_URL` | `https://jouwdomein.nl` (eerst de `*.netlify.app`-URL, na het koppelen je domein) |
| `AUTH_URL` | zelfde als `APP_URL` |
| `NEXT_PUBLIC_APP_URL` | zelfde als `APP_URL` |
| `DEMO_MODE` | `true` (testfase) |
| `PAYMENT_PROVIDER` | `fake` (testfase; later `mollie` + `MOLLIE_API_KEY`) |
| `ANTHROPIC_API_KEY` | optioneel: echte AI-antwoorden in de hulp-chat |

Daarna **Deploys → Trigger deploy**. De build zet zelf de tabellen in Neon klaar (`prisma migrate deploy`)
en vult de demodata één keer.

## 3. Domein
Domain management → Add a domain → volg de DNS-stappen. Zet daarna `APP_URL`, `AUTH_URL` en
`NEXT_PUBLIC_APP_URL` op het nieuwe domein en deploy opnieuw.

## 4. Testen
- `/login` → knoppen **Demo: eigenaar / admin**, **Demo: bedrijf**, **Demo: Finder**.
- Mails (inloglinks, bevestigingen) staan tijdens de testfase op `/api/dev/mail`.
- Betalen gaat via een testcheckout.
- De dagelijkse taken draaien om 06:00 UTC via `netlify/functions/daily-cron.mts`.

## 5. Live gaan (echte gebruikers)
1. Resend: `RESEND_API_KEY` + `EMAIL_FROM` met geverifieerd domein.
2. Mollie: `PAYMENT_PROVIDER=mollie` + `MOLLIE_API_KEY`.
3. `DEMO_MODE` verwijderen. Daarmee verdwijnen de demo-knoppen, de testmailbox en de testcheckout.
4. Demo-accounts verwijderen: alles met een `@findersarmy.test`-adres.
5. Voorwaarden laten controleren door een jurist.
