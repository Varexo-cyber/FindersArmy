import type { EmailBlock } from "@/emails/layout";
import type { NotificationData, NotificationType } from "./types";

type Copy = (d: NotificationData) => { subject: string; title: string; block: Omit<EmailBlock, "cta"> & { ctaLabel?: string } };

const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));

/**
 * Notification copy, per locale. The in-app centre shows `title`; email uses the full block.
 * Data values are pre-formatted strings (money already formatted by the caller).
 */
const nl: Record<NotificationType, Copy> = {
  FINDER_LEAD_RECEIVED: (d) => ({
    subject: `Je klant heeft een aanvraag gedaan bij ${s(d.business)}`,
    title: `${s(d.customer)} heeft een aanvraag gedaan bij ${s(d.business)}`,
    block: {
      heading: "Je link werkt.",
      paragraphs: [
        `${s(d.customer)} uit ${s(d.city)} heeft via jouw link een aanvraag gedaan bij ${s(d.business)}.`,
        "Het bedrijf neemt contact op. Je ziet elke stap terug in je overzicht. Gaat de klus door, dan krijg je je fee.",
      ],
      ctaLabel: "Bekijk je klanten",
    },
  }),
  FINDER_QUOTE_SENT: (d) => ({
    subject: `${s(d.business)} heeft een offerte gestuurd aan ${s(d.customer)}`,
    title: `Offerte verstuurd aan ${s(d.customer)}`,
    block: {
      heading: "Er ligt een offerte.",
      paragraphs: [`${s(d.business)} heeft een offerte gestuurd aan ${s(d.customer)}. Nu is het aan de klant.`],
      ctaLabel: "Bekijk status",
    },
  }),
  FINDER_DEAL_WON: (d) => ({
    subject: `Deal gewonnen: je verdient ${s(d.amount)}`,
    title: `Deal gewonnen bij ${s(d.business)}: verwacht ${s(d.amount)}`,
    block: {
      heading: "Deal gewonnen.",
      amountLabel: "Verwacht voor jou",
      amount: s(d.amount),
      paragraphs: [
        `${s(d.customer)} heeft gekozen voor ${s(d.business)}. Zodra de klus is bevestigd en het bedrijf heeft betaald, staat dit bedrag op je beschikbare saldo.`,
      ],
      ctaLabel: "Bekijk je saldo",
    },
  }),
  FINDER_DEAL_LOST: (d) => ({
    subject: `Geen deal bij ${s(d.business)}`,
    title: `Geen deal: ${s(d.customer)} bij ${s(d.business)}`,
    block: {
      heading: "Deze ging niet door.",
      paragraphs: [`De aanvraag van ${s(d.customer)} bij ${s(d.business)} is niet doorgegaan. Reden: ${s(d.reason)}.`, "Klopt dit niet? Meld het via de lead in je overzicht."],
      ctaLabel: "Bekijk je klanten",
    },
  }),
  FINDER_MONEY_AVAILABLE: (d) => ({
    subject: `${s(d.amount)} staat klaar om uit te betalen`,
    title: `${s(d.amount)} beschikbaar`,
    block: {
      heading: "Je geld staat klaar.",
      amountLabel: "Nu beschikbaar",
      amount: s(d.amount),
      paragraphs: [`${s(d.business)} heeft betaald. Je kunt een uitbetaling aanvragen zodra je beschikbare saldo minimaal ${s(d.minimum)} is.`],
      ctaLabel: "Uitbetaling aanvragen",
    },
  }),
  FINDER_PAYOUT_PAID: (d) => ({
    subject: `Uitbetaald: ${s(d.amount)}`,
    title: `${s(d.amount)} uitbetaald`,
    block: {
      heading: "Uitbetaald.",
      amountLabel: "Overgemaakt naar je rekening",
      amount: s(d.amount),
      paragraphs: [`We hebben het bedrag overgemaakt naar ${s(d.iban)}. Afhankelijk van je bank staat het binnen 1 à 2 werkdagen op je rekening.`],
      ctaLabel: "Download je specificatie",
    },
  }),
  FINDER_RANK_UP: (d) => ({
    subject: `Promotie: je bent nu ${s(d.rank)}`,
    title: `Je bent gepromoveerd tot ${s(d.rank)}`,
    block: {
      heading: `Promotie: ${s(d.rank)}.`,
      paragraphs: [`Je hebt ${s(d.deals)} betaalde deals binnengehaald. Vanaf nu krijg je ${s(d.share)} van elke fee.`],
      ctaLabel: "Bekijk je rang",
    },
  }),
  FINDER_BONUS: (d) => ({
    subject: `Bonus: ${s(d.amount)}`,
    title: `Bonus van ${s(d.amount)}: ${s(d.reason)}`,
    block: { heading: "Bonus bijgeschreven.", amount: s(d.amount), paragraphs: [s(d.reason)], ctaLabel: "Bekijk je saldo" },
  }),
  FINDER_WARNING: (d) => ({
    subject: "Let op: de kwaliteit van je aanvragen",
    title: "Waarschuwing over de kwaliteit van je aanvragen",
    block: {
      heading: "Even serieus.",
      paragraphs: [
        `Van je recente aanvragen werd ${s(d.badPct)} door bedrijven als onzin of spam gemarkeerd.`,
        "Stuur je link alleen naar mensen die echt iets nodig hebben. Blijft de kwaliteit laag, dan schorsen we je account.",
      ],
    },
  }),
  BUSINESS_NEW_LEAD: (d) => ({
    subject: `Nieuwe aanvraag van ${s(d.customer)}`,
    title: `Nieuwe aanvraag: ${s(d.customer)} (${s(d.city)})`,
    block: {
      heading: "Nieuwe aanvraag.",
      paragraphs: [
        `${s(d.customer)} uit ${s(d.city)} wil: "${s(d.description)}"`,
        `Neem binnen ${s(d.hours)} uur contact op en zet de status op Contact opgenomen. Reactiesnelheid telt mee in je score.`,
      ],
      ctaLabel: "Open de aanvraag",
    },
  }),
  BUSINESS_RESPONSE_REMINDER: (d) => ({
    subject: `Herinnering: ${s(d.customer)} wacht op je reactie`,
    title: `${s(d.customer)} wacht nog op contact`,
    block: {
      heading: "Er wacht iemand op je.",
      paragraphs: [`De aanvraag van ${s(d.customer)} staat nog op Nieuw. Bel of mail vandaag en werk de status bij.`],
      ctaLabel: "Open de aanvraag",
    },
  }),
  BUSINESS_APPROVED: (d) => ({
    subject: `${s(d.business)} staat live op FindersArmy`,
    title: "Je bedrijf is goedgekeurd",
    block: {
      heading: "Je staat live.",
      paragraphs: ["Je aanmelding is goedgekeurd en je campagne is zichtbaar voor Finders. Je betaalt alleen als een aangebrachte klant echt klant wordt."],
      ctaLabel: "Naar je dashboard",
    },
  }),
  BUSINESS_REJECTED: (d) => ({
    subject: `Je aanmelding bij FindersArmy`,
    title: "Je aanmelding is niet goedgekeurd",
    block: { heading: "Niet goedgekeurd.", paragraphs: [`We kunnen ${s(d.business)} op dit moment niet toelaten. Reden: ${s(d.reason)}.`, "Vragen? Antwoord op deze e-mail."] },
  }),
  BUSINESS_INVOICE: (d) => ({
    subject: `Factuur ${s(d.number)}: ${s(d.amount)}`,
    title: `Factuur ${s(d.number)} — ${s(d.amount)}`,
    block: {
      heading: `Factuur ${s(d.number)}.`,
      amountLabel: "Te betalen (incl. BTW)",
      amount: s(d.amount),
      paragraphs: [`Voor de gewonnen klant ${s(d.customer)}. Betaal vóór ${s(d.dueDate)} met iDEAL, Bancontact of creditcard. De PDF staat in je dashboard.`],
      ctaLabel: "Nu betalen",
    },
  }),
  BUSINESS_INVOICE_REMINDER: (d) => ({
    subject: `Herinnering: factuur ${s(d.number)} staat open`,
    title: `Factuur ${s(d.number)} staat nog open`,
    block: {
      heading: "Je factuur staat nog open.",
      amount: s(d.amount),
      paragraphs: [
        `Factuur ${s(d.number)} is ${s(d.days)} dagen oud.`,
        `Na ${s(d.suspendDays)} dagen pauzeren we automatisch al je campagnes tot de factuur is betaald.`,
      ],
      ctaLabel: "Nu betalen",
    },
  }),
  BUSINESS_SUSPENDED: (d) => ({
    subject: "Je campagnes zijn gepauzeerd",
    title: "Campagnes gepauzeerd",
    block: {
      heading: "Je campagnes zijn gepauzeerd.",
      paragraphs: [`Reden: ${s(d.reason)}`, "Zodra dit is opgelost, zetten we je campagnes direct weer aan."],
      ctaLabel: "Naar je facturen",
    },
  }),
  BUSINESS_REINSTATED: () => ({
    subject: "Je campagnes staan weer live",
    title: "Campagnes weer live",
    block: { heading: "Je staat weer live.", paragraphs: ["Bedankt voor je betaling. Je campagnes zijn weer zichtbaar voor Finders."], ctaLabel: "Naar je dashboard" },
  }),
  BUSINESS_BUDGET_REACHED: (d) => ({
    subject: `Maandbudget bereikt: ${s(d.campaign)}`,
    title: `Maandbudget bereikt voor ${s(d.campaign)}`,
    block: {
      heading: "Je maandbudget is op.",
      paragraphs: [`De campagne ${s(d.campaign)} is gepauzeerd tot volgende maand. Je kunt het budget verhogen in je dashboard.`],
      ctaLabel: "Budget aanpassen",
    },
  }),
  BUSINESS_DISPUTE: (d) => ({
    subject: `Geschil over ${s(d.customer)}`,
    title: `Geschil geopend over ${s(d.customer)}`,
    block: { heading: "Er is een geschil geopend.", paragraphs: [s(d.reason), "Ons team neemt contact met je op."], ctaLabel: "Bekijk lead" },
  }),
  CUSTOMER_REQUEST_RECEIVED: (d) => ({
    subject: `Je aanvraag bij ${s(d.business)} is verstuurd`,
    title: "Aanvraag verstuurd",
    block: {
      heading: `Je aanvraag is binnen bij ${s(d.business)}.`,
      paragraphs: [
        `Hoi ${s(d.firstName)}, ${s(d.business)} neemt contact met je op over: "${s(d.description)}".`,
        "Je gegevens zijn alleen gedeeld met dit bedrijf. Je hoeft niets te doen en je zit nergens aan vast.",
        "Gaat de klus door? Dan vragen we je later om met één klik te bevestigen dat het werk is uitgevoerd.",
      ],
    },
  }),
  CUSTOMER_CONFIRM_JOB: (d) => ({
    subject: `Is de klus van ${s(d.business)} uitgevoerd?`,
    title: "Bevestig je klus",
    block: {
      heading: `Is de klus van ${s(d.business)} uitgevoerd?`,
      paragraphs: [
        `Hoi ${s(d.firstName)}, bevestig met één klik dat het werk is gedaan. Als dank krijg je een cadeaubon van ${s(d.bonus)}.`,
        "Klopt het bedrag niet, of is de klus niet gedaan? Dat kun je op dezelfde pagina aangeven.",
      ],
      ctaLabel: "Bevestig de klus",
      footnote: "Deze link is persoonlijk. Stuur hem niet door.",
    },
  }),
  ADMIN_NEW_BUSINESS: (d) => ({
    subject: `Nieuwe aanmelding: ${s(d.business)}`,
    title: `Nieuwe bedrijfsaanmelding: ${s(d.business)}`,
    block: { heading: "Nieuwe aanmelding.", paragraphs: [`${s(d.business)} (${s(d.category)}) wacht op goedkeuring.`], ctaLabel: "Beoordelen" },
  }),
  ADMIN_DISPUTE: (d) => ({
    subject: `Geschil: ${s(d.business)}`,
    title: `Nieuw geschil bij ${s(d.business)}`,
    block: { heading: "Nieuw geschil.", paragraphs: [s(d.reason)], ctaLabel: "Afhandelen" },
  }),
  ADMIN_PAYOUT_REQUEST: (d) => ({
    subject: `Uitbetalingsverzoek: ${s(d.amount)}`,
    title: `Uitbetalingsverzoek van ${s(d.amount)}`,
    block: { heading: "Nieuw uitbetalingsverzoek.", amount: s(d.amount), paragraphs: [`Van ${s(d.finder)}.`], ctaLabel: "Naar de wachtrij" },
  }),
  ADMIN_REPORT: (d) => ({
    subject: `Melding van Finder over ${s(d.business)}`,
    title: `Finder meldt uitgevoerde klus bij ${s(d.business)}`,
    block: { heading: "Nieuwe melding.", paragraphs: [s(d.message)], ctaLabel: "Bekijken" },
  }),
  ADMIN_FRAUD_FLAG: (d) => ({
    subject: `Verdachte aanvraag: ${s(d.flags)}`,
    title: `Verdachte aanvraag (${s(d.flags)})`,
    block: { heading: "Verdachte aanvraag.", paragraphs: [`Signalen: ${s(d.flags)}. Lead ${s(d.leadId)}.`], ctaLabel: "Bekijken" },
  }),
};

const en: Record<NotificationType, Copy> = {
  FINDER_LEAD_RECEIVED: (d) => ({
    subject: `Your contact sent a request to ${s(d.business)}`,
    title: `${s(d.customer)} sent a request to ${s(d.business)}`,
    block: { heading: "Your link works.", paragraphs: [`${s(d.customer)} from ${s(d.city)} sent a request to ${s(d.business)} through your link.`, "The business will get in touch. You can follow every step in your overview."], ctaLabel: "View your customers" },
  }),
  FINDER_QUOTE_SENT: (d) => ({
    subject: `${s(d.business)} sent a quote to ${s(d.customer)}`,
    title: `Quote sent to ${s(d.customer)}`,
    block: { heading: "A quote is out.", paragraphs: [`${s(d.business)} sent a quote to ${s(d.customer)}. Now it's up to the customer.`], ctaLabel: "View status" },
  }),
  FINDER_DEAL_WON: (d) => ({
    subject: `Deal won: you earn ${s(d.amount)}`,
    title: `Deal won at ${s(d.business)}: expected ${s(d.amount)}`,
    block: { heading: "Deal won.", amountLabel: "Expected for you", amount: s(d.amount), paragraphs: [`${s(d.customer)} chose ${s(d.business)}. Once the job is confirmed and the business has paid, this moves to your available balance.`], ctaLabel: "View your balance" },
  }),
  FINDER_DEAL_LOST: (d) => ({
    subject: `No deal at ${s(d.business)}`,
    title: `No deal: ${s(d.customer)} at ${s(d.business)}`,
    block: { heading: "This one didn't go through.", paragraphs: [`Reason: ${s(d.reason)}.`, "Think this is wrong? Report it from the lead in your overview."], ctaLabel: "View your customers" },
  }),
  FINDER_MONEY_AVAILABLE: (d) => ({
    subject: `${s(d.amount)} is ready to pay out`,
    title: `${s(d.amount)} available`,
    block: { heading: "Your money is ready.", amountLabel: "Available now", amount: s(d.amount), paragraphs: [`${s(d.business)} has paid. You can request a payout once your available balance is at least ${s(d.minimum)}.`], ctaLabel: "Request payout" },
  }),
  FINDER_PAYOUT_PAID: (d) => ({
    subject: `Paid out: ${s(d.amount)}`,
    title: `${s(d.amount)} paid out`,
    block: { heading: "Paid out.", amount: s(d.amount), paragraphs: [`We transferred the amount to ${s(d.iban)}.`], ctaLabel: "Download your statement" },
  }),
  FINDER_RANK_UP: (d) => ({
    subject: `Promoted: you are now ${s(d.rank)}`,
    title: `Promoted to ${s(d.rank)}`,
    block: { heading: `Promotion: ${s(d.rank)}.`, paragraphs: [`You have ${s(d.deals)} paid deals. From now on you receive ${s(d.share)} of every fee.`], ctaLabel: "View your rank" },
  }),
  FINDER_BONUS: (d) => ({
    subject: `Bonus: ${s(d.amount)}`,
    title: `Bonus of ${s(d.amount)}: ${s(d.reason)}`,
    block: { heading: "Bonus added.", amount: s(d.amount), paragraphs: [s(d.reason)], ctaLabel: "View your balance" },
  }),
  FINDER_WARNING: (d) => ({
    subject: "Heads up: the quality of your requests",
    title: "Warning about request quality",
    block: { heading: "Let's be serious.", paragraphs: [`${s(d.badPct)} of your recent requests were marked as spam by businesses.`, "Only share your link with people who actually need something. If quality stays low, we will suspend your account."] },
  }),
  BUSINESS_NEW_LEAD: (d) => ({
    subject: `New request from ${s(d.customer)}`,
    title: `New request: ${s(d.customer)} (${s(d.city)})`,
    block: { heading: "New request.", paragraphs: [`${s(d.customer)} from ${s(d.city)} wants: "${s(d.description)}"`, `Get in touch within ${s(d.hours)} hours and set the status to Contacted.`], ctaLabel: "Open request" },
  }),
  BUSINESS_RESPONSE_REMINDER: (d) => ({
    subject: `Reminder: ${s(d.customer)} is waiting`,
    title: `${s(d.customer)} is still waiting`,
    block: { heading: "Someone is waiting for you.", paragraphs: [`The request from ${s(d.customer)} is still New. Call or email today and update the status.`], ctaLabel: "Open request" },
  }),
  BUSINESS_APPROVED: () => ({
    subject: "You're live on FindersArmy",
    title: "Your business is approved",
    block: { heading: "You're live.", paragraphs: ["Your sign-up is approved and your campaign is visible to Finders."], ctaLabel: "Go to dashboard" },
  }),
  BUSINESS_REJECTED: (d) => ({
    subject: "Your FindersArmy application",
    title: "Your application was not approved",
    block: { heading: "Not approved.", paragraphs: [`Reason: ${s(d.reason)}.`] },
  }),
  BUSINESS_INVOICE: (d) => ({
    subject: `Invoice ${s(d.number)}: ${s(d.amount)}`,
    title: `Invoice ${s(d.number)} — ${s(d.amount)}`,
    block: { heading: `Invoice ${s(d.number)}.`, amountLabel: "Due (incl. VAT)", amount: s(d.amount), paragraphs: [`For won customer ${s(d.customer)}. Pay before ${s(d.dueDate)}.`], ctaLabel: "Pay now" },
  }),
  BUSINESS_INVOICE_REMINDER: (d) => ({
    subject: `Reminder: invoice ${s(d.number)} is unpaid`,
    title: `Invoice ${s(d.number)} is unpaid`,
    block: { heading: "Your invoice is still open.", amount: s(d.amount), paragraphs: [`Invoice ${s(d.number)} is ${s(d.days)} days old. After ${s(d.suspendDays)} days all campaigns are paused until paid.`], ctaLabel: "Pay now" },
  }),
  BUSINESS_SUSPENDED: (d) => ({
    subject: "Your campaigns are paused",
    title: "Campaigns paused",
    block: { heading: "Your campaigns are paused.", paragraphs: [`Reason: ${s(d.reason)}`], ctaLabel: "View invoices" },
  }),
  BUSINESS_REINSTATED: () => ({
    subject: "Your campaigns are live again",
    title: "Campaigns live again",
    block: { heading: "You're live again.", paragraphs: ["Thanks for your payment."], ctaLabel: "Go to dashboard" },
  }),
  BUSINESS_BUDGET_REACHED: (d) => ({
    subject: `Monthly budget reached: ${s(d.campaign)}`,
    title: `Monthly budget reached for ${s(d.campaign)}`,
    block: { heading: "Your monthly budget is used.", paragraphs: [`${s(d.campaign)} is paused until next month.`], ctaLabel: "Adjust budget" },
  }),
  BUSINESS_DISPUTE: (d) => ({
    subject: `Dispute about ${s(d.customer)}`,
    title: `Dispute opened about ${s(d.customer)}`,
    block: { heading: "A dispute was opened.", paragraphs: [s(d.reason)], ctaLabel: "View lead" },
  }),
  CUSTOMER_REQUEST_RECEIVED: (d) => ({
    subject: `Your request to ${s(d.business)} was sent`,
    title: "Request sent",
    block: { heading: `${s(d.business)} received your request.`, paragraphs: [`Hi ${s(d.firstName)}, ${s(d.business)} will contact you about: "${s(d.description)}".`, "Your details are shared with this business only."] },
  }),
  CUSTOMER_CONFIRM_JOB: (d) => ({
    subject: `Was the job by ${s(d.business)} completed?`,
    title: "Confirm your job",
    block: { heading: `Was the job by ${s(d.business)} completed?`, paragraphs: [`Hi ${s(d.firstName)}, confirm with one click and receive a ${s(d.bonus)} gift card.`], ctaLabel: "Confirm the job", footnote: "This link is personal. Please don't forward it." },
  }),
  ADMIN_NEW_BUSINESS: (d) => ({ subject: `New sign-up: ${s(d.business)}`, title: `New business: ${s(d.business)}`, block: { heading: "New sign-up.", paragraphs: [`${s(d.business)} awaits review.`], ctaLabel: "Review" } }),
  ADMIN_DISPUTE: (d) => ({ subject: `Dispute: ${s(d.business)}`, title: `New dispute at ${s(d.business)}`, block: { heading: "New dispute.", paragraphs: [s(d.reason)], ctaLabel: "Handle" } }),
  ADMIN_PAYOUT_REQUEST: (d) => ({ subject: `Payout request: ${s(d.amount)}`, title: `Payout request of ${s(d.amount)}`, block: { heading: "New payout request.", amount: s(d.amount), paragraphs: [`From ${s(d.finder)}.`], ctaLabel: "Open queue" } }),
  ADMIN_REPORT: (d) => ({ subject: `Finder report about ${s(d.business)}`, title: `Finder report about ${s(d.business)}`, block: { heading: "New report.", paragraphs: [s(d.message)], ctaLabel: "View" } }),
  ADMIN_FRAUD_FLAG: (d) => ({ subject: `Suspicious request: ${s(d.flags)}`, title: `Suspicious request (${s(d.flags)})`, block: { heading: "Suspicious request.", paragraphs: [`Signals: ${s(d.flags)}.`], ctaLabel: "View" } }),
};

export function notificationCopy(type: NotificationType, locale: string, data: NotificationData) {
  return (locale === "en" ? en : nl)[type](data);
}
