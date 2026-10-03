export interface FaqItem {
  q: string;
  a: string;
}

export type FaqGroup = "finders" | "business" | "customers" | "privacy";

export const FAQ: Record<"nl" | "en", Record<FaqGroup, FaqItem[]>> = {
  nl: {
    finders: [
      { q: "Wat is een Finder?", a: "Iemand die een klant aanbrengt bij een lokaal bedrijf. Je kent iemand die iets nodig heeft, je stuurt je persoonlijke link, en als de klus doorgaat krijg je een finder's fee." },
      { q: "Kost het iets om Finder te worden?", a: "Nee. Aanmelden is gratis en je zit nergens aan vast. Je betaalt nooit iets." },
      { q: "Hoeveel verdien ik?", a: "Dat hangt af van de fee die het bedrijf heeft ingesteld en van je rang. Je ziet bij elke campagne wat je kunt verdienen, met een rekenvoorbeeld. Als Rekruut krijg je 60% van de fee, als Commandant 70%." },
      { q: "Wanneer krijg ik mijn geld?", a: "Zodra het bedrijf de factuur voor jouw klant heeft betaald, staat je fee als beschikbaar saldo klaar. Vanaf € 25 vraag je een uitbetaling aan. We maken over in de eerstvolgende betaalronde, meestal binnen een week." },
      { q: "Wat gebeurt er als het bedrijf de klus niet doorgeeft?", a: "De klant krijgt na de deal automatisch een e-mail om te bevestigen dat de klus is uitgevoerd. Daarnaast kun je zelf melden dat je weet dat de klus is gedaan. Ons team zoekt het dan uit. Bedrijven die niet eerlijk zijn, worden geschorst." },
      { q: "Moet ik belasting betalen over mijn verdiensten?", a: "Inkomsten uit FindersArmy zijn in principe belastbaar als resultaat uit overige werkzaamheden. Je ontvangt per uitbetaling een specificatie. We werken samen met een boekhouder aan een duidelijke jaaropgave." },
      { q: "Is dit een piramidesysteem?", a: "Nee. Je verdient alleen aan klanten die jij zelf aanbrengt. Nodig je een vriend uit, dan krijg je eenmalig € 25 als die zijn eerste betaalde deal binnenhaalt. Daarna niets meer, en nooit iets uit het netwerk van je vriend." },
      { q: "Mag ik mijn link op social media zetten?", a: "Ja, zolang je eerlijk bent over wat het is en geen spam verstuurt. Massaal ongevraagd berichten sturen is niet toegestaan." },
    ],
    business: [
      { q: "Wat kost FindersArmy?", a: "Alleen de finder's fee die je zelf instelt, per klant die via FindersArmy binnenkwam én klant werd. Geen abonnement, geen kosten per lead, geen opstartkosten." },
      { q: "Wanneer betaal ik?", a: "Als de klant bevestigt dat de klus is gedaan, of als jij de klus op afgerond zet. Je krijgt dan een factuur met een iDEAL-betaallink en 14 dagen betaaltermijn." },
      { q: "Wat als een aanvraag niets wordt?", a: "Dan betaal je niets. Je zet de aanvraag op Niet doorgegaan met een reden." },
      { q: "Wat is de aanbrengclausule?", a: "Een klant die via FindersArmy bij je binnenkwam, telt 12 maanden lang als aangebracht. Ook als je daarna buiten het platform om afspraken maakt. Zo kan een Finder erop vertrouwen dat zijn tip betaald wordt." },
      { q: "Kan ik mijn kosten begrenzen?", a: "Ja. Je stelt een minimum klusbedrag in (daaronder geen fee) en optioneel een maandbudget. Is dat op, dan pauzeert je campagne automatisch tot de volgende maand." },
      { q: "Wat gebeurt er als ik een factuur niet betaal?", a: "Je krijgt herinneringen op dag 7, 14 en 21. Na 21 dagen worden al je campagnes gepauzeerd tot de factuur is betaald." },
      { q: "Moet ik al mijn producten op FindersArmy zetten?", a: "Nee. Je maakt een campagne met één fee-regel en kunt verwijzen naar je eigen website, AutoScout24 of Marktplaats." },
    ],
    customers: [
      { q: "Heb ik een account nodig?", a: "Nee. Je vult het formulier in via de link die je kreeg. Meer is niet nodig." },
      { q: "Kost het mij iets?", a: "Nee. Je betaalt het bedrijf gewoon voor de klus, zoals altijd. De finder's fee betaalt het bedrijf, niet jij." },
      { q: "Wie ziet mijn gegevens?", a: "Alleen het bedrijf waar je de aanvraag deed, en ons team als er iets moet worden uitgezocht. De persoon die je de link stuurde ziet alleen je voornaam en woonplaats." },
      { q: "Waarom krijg ik een cadeaubon?", a: "Als bedankje voor het bevestigen dat de klus is uitgevoerd. Daarmee helpen we te controleren dat iedereen eerlijk betaald wordt." },
    ],
    privacy: [
      { q: "Verkopen jullie gegevens?", a: "Nee. Nooit. Klantgegevens gaan alleen naar het bedrijf waar de klant iets aanvroeg." },
      { q: "Gebruiken jullie tracking-cookies?", a: "Nee. We gebruiken alleen functionele cookies: om je ingelogd te houden en om bij te houden via welke link een klant binnenkwam. Bezoekersstatistieken meten we zonder cookies." },
      { q: "Kan ik mijn gegevens laten verwijderen?", a: "Ja. In je profiel kun je je gegevens downloaden en je account verwijderen. Gegevens die we wettelijk moeten bewaren, zoals facturen en uitbetalingen, bewaren we geanonimiseerd." },
      { q: "Hoe lang bewaren jullie aanvragen?", a: "Afgewezen of niet doorgegane aanvragen worden na 12 maanden automatisch geanonimiseerd." },
    ],
  },
  en: {
    finders: [
      { q: "What is a Finder?", a: "Someone who brings a customer to a local business. You know someone who needs something, you send your personal link, and when the job goes ahead you get a finder's fee." },
      { q: "Does it cost anything to become a Finder?", a: "No. Sign-up is free and there's no commitment. You never pay anything." },
      { q: "How much do I earn?", a: "It depends on the fee the business set and on your rank. Each campaign shows what you can earn, with a worked example. As a Recruit you get 60% of the fee, as Commander 70%." },
      { q: "When do I get my money?", a: "Once the business has paid the invoice for your customer, your fee is available. From € 25 you request a payout. We transfer in the next payment run, usually within a week." },
      { q: "What if the business doesn't report the job?", a: "After the deal, the customer automatically gets an email to confirm the job was done. You can also report that you know the job was done. Our team will investigate. Businesses that aren't honest get suspended." },
      { q: "Do I pay tax on my earnings?", a: "Income from FindersArmy is generally taxable in the Netherlands as income from other activities. You receive a statement with every payout. We're working with an accountant on a clear annual statement." },
      { q: "Is this a pyramid scheme?", a: "No. You only earn from customers you bring in yourself. If you invite a friend, you get a one-off € 25 when they bring in their first paid deal. Nothing after that, and never anything from your friend's network." },
      { q: "Can I post my link on social media?", a: "Yes, as long as you're honest about what it is and don't spam. Mass unsolicited messaging is not allowed." },
    ],
    business: [
      { q: "What does FindersArmy cost?", a: "Only the finder's fee you set yourself, per customer who came in through FindersArmy and became your customer. No subscription, no cost per lead, no setup costs." },
      { q: "When do I pay?", a: "When the customer confirms the job was done, or when you mark the job completed. You then receive an invoice with an iDEAL payment link and 14 days to pay." },
      { q: "What if a request goes nowhere?", a: "Then you pay nothing. You mark the request as Didn't go ahead, with a reason." },
      { q: "What is the referral clause?", a: "A customer who came to you through FindersArmy counts as referred for 12 months, even if you make arrangements outside the platform afterwards. That way a Finder can trust their tip gets paid." },
      { q: "Can I cap my costs?", a: "Yes. You set a minimum job amount (no fee below it) and optionally a monthly budget. When it's used up, your campaign pauses until next month." },
      { q: "What happens if I don't pay an invoice?", a: "You get reminders on day 7, 14 and 21. After 21 days all your campaigns are paused until the invoice is paid." },
      { q: "Do I need to list all my products?", a: "No. You create a campaign with one fee rule and can link to your own website, AutoScout24 or Marktplaats." },
    ],
    customers: [
      { q: "Do I need an account?", a: "No. You fill in the form through the link you received. That's all." },
      { q: "Does it cost me anything?", a: "No. You pay the business for the job as usual. The finder's fee is paid by the business, not by you." },
      { q: "Who sees my details?", a: "Only the business you sent the request to, and our team if something needs investigating. The person who sent you the link only sees your first name and city." },
      { q: "Why do I get a gift card?", a: "As a thank-you for confirming the job was done. It helps us check that everyone gets paid fairly." },
    ],
    privacy: [
      { q: "Do you sell data?", a: "No. Never. Customer details only go to the business the customer contacted." },
      { q: "Do you use tracking cookies?", a: "No. We only use functional cookies: to keep you logged in and to remember which link a customer came through. We measure visits without cookies." },
      { q: "Can I have my data deleted?", a: "Yes. In your profile you can download your data and delete your account. Data we're legally required to keep, such as invoices and payouts, is retained in anonymised form." },
      { q: "How long do you keep requests?", a: "Rejected or cancelled requests are automatically anonymised after 12 months." },
    ],
  },
};
