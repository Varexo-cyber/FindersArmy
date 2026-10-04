import type { FeeRule } from "@/lib/fees";

/**
 * Launch categories, grouped by sector. `example` is a worked example used on marketing pages:
 * a typical job amount and a plausible fee rule. It is labelled as an example everywhere; real
 * fees come from each business's own campaign.
 */
export type CategoryGroup = "wonen" | "energie" | "buiten" | "auto" | "events" | "sport" | "zakelijk" | "leren" | "diensten";

export const CATEGORY_GROUPS: { key: CategoryGroup; nl: string; en: string }[] = [
  { key: "wonen", nl: "Wonen & verbouwen", en: "Home & renovation" },
  { key: "energie", nl: "Energie & duurzaam", en: "Energy & sustainability" },
  { key: "buiten", nl: "Tuin & buiten", en: "Garden & outdoor" },
  { key: "auto", nl: "Auto & vervoer", en: "Cars & mobility" },
  { key: "events", nl: "Bruiloft & events", en: "Weddings & events" },
  { key: "sport", nl: "Sport & lifestyle", en: "Sport & lifestyle" },
  { key: "zakelijk", nl: "Zakelijk & tech", en: "Business & tech" },
  { key: "leren", nl: "Lessen & opleiding", en: "Lessons & training" },
  { key: "diensten", nl: "Diensten aan huis", en: "Home services" },
];

export interface CategoryDef {
  slug: string;
  group: CategoryGroup;
  nameNl: string;
  nameEn: string;
  descriptionNl: string;
  descriptionEn: string;
  whoNl: string;
  whoEn: string;
  exampleJobCents: number;
  example: FeeRule;
}

const pct = (bps: number, minJob = 50_000, minFee = 5_000): FeeRule => ({ feeType: "PERCENTAGE", feePercentBps: bps, minJobAmountCents: minJob, minFeeCents: minFee });
const fixed = (cents: number, minJob = 0): FeeRule => ({ feeType: "FIXED", feeFixedCents: cents, minJobAmountCents: minJob, minFeeCents: 0 });
const tiers = (minJob: number, ...t: [number, number][]): FeeRule => ({ feeType: "TIERED", tiers: t.map(([fromCents, feeCents]) => ({ fromCents, feeCents })), minJobAmountCents: minJob, minFeeCents: 5_000 });
const eur = (n: number) => n * 100;

type Row = [slug: string, group: CategoryGroup, nl: string, en: string, descNl: string, descEn: string, whoNl: string, whoEn: string, jobEur: number, rule: FeeRule];

const ROWS: Row[] = [
  // Wonen & verbouwen
  ["schilders", "wonen", "Schilders", "Painters", "Binnen- en buitenschilderwerk, kozijnen, houtrot.", "Interior and exterior painting, window frames, wood rot.", "Iemand wiens kozijnen bladderen, of die net een huis heeft gekocht.", "Someone whose window frames are peeling, or who just bought a house.", 5_000, pct(1000)],
  ["stukadoors", "wonen", "Stukadoors", "Plasterers", "Wanden en plafonds stucen, spackspuiten, sierpleister.", "Plastering walls and ceilings, spray finishes, decorative plaster.", "Iemand die gaat verbouwen of een oud huis opknapt.", "Someone renovating or doing up an old house.", 3_000, pct(1000)],
  ["loodgieters", "wonen", "Loodgieters", "Plumbers", "Leidingwerk, afvoer, lekkages, sanitair.", "Pipework, drains, leaks, sanitary fittings.", "Iemand met een lekkage, een verstopte afvoer of een nieuwe aansluiting.", "Someone with a leak, a blocked drain or a new connection.", 1_200, pct(1000)],
  ["dakdekkers", "wonen", "Dakdekkers", "Roofers", "Dakrenovatie, bitumen, dakpannen, dakgoten.", "Roof renovation, bitumen, tiles, gutters.", "Iemand met een lekkend dak of een plat dak dat aan vervanging toe is.", "Someone with a leaking roof or a flat roof due for replacement.", 8_000, pct(800)],
  ["elektriciens", "wonen", "Elektriciens", "Electricians", "Groepenkast, bekabeling, verlichting, storingen.", "Fuse boxes, wiring, lighting, faults.", "Iemand met een groepenkast die te klein is, of die gaat verbouwen.", "Someone with an undersized fuse box, or renovating.", 2_500, pct(1000)],
  ["badkamers", "wonen", "Badkamers", "Bathrooms", "Complete badkamerrenovatie, tegelwerk, sanitair.", "Complete bathroom renovation, tiling, fixtures.", "Iemand met een gedateerde badkamer of een nieuwbouwwoning.", "Someone with a dated bathroom or a new-build home.", 12_000, pct(600)],
  ["keukens", "wonen", "Keukens", "Kitchens", "Keukens op maat, montage, werkbladen, apparatuur.", "Custom kitchens, fitting, worktops, appliances.", "Iemand die verhuist of zijn keuken wil vervangen.", "Someone moving house or replacing their kitchen.", 15_000, tiers(eur(5_000), [eur(5_000), eur(250)], [eur(10_000), eur(500)], [eur(20_000), eur(800)])],
  ["kozijnen", "wonen", "Kozijnen", "Window frames", "Kunststof, houten en aluminium kozijnen, deuren, glas.", "uPVC, wooden and aluminium frames, doors, glazing.", "Iemand met tochtige ramen of enkel glas.", "Someone with draughty windows or single glazing.", 10_000, pct(600)],
  ["tegelzetters", "wonen", "Tegelzetters", "Tilers", "Wand- en vloertegels, natuursteen, grootformaat tegels.", "Wall and floor tiles, natural stone, large-format tiles.", "Iemand die een nieuwe vloer of badkamer wil.", "Someone who wants a new floor or bathroom.", 4_000, pct(1000)],
  ["timmerlieden", "wonen", "Timmerlieden", "Carpenters", "Trappen, kasten, aftimmeren, houten vloeren.", "Stairs, cupboards, finishing carpentry, wooden floors.", "Iemand die maatwerk in huis wil.", "Someone who wants custom woodwork at home.", 3_500, pct(1000)],
  ["aannemers", "wonen", "Aannemers & aanbouw", "Builders & extensions", "Aanbouw, uitbouw, verbouwing van A tot Z.", "Extensions and full renovations from A to Z.", "Een gezin dat meer ruimte nodig heeft.", "A family that needs more space.", 45_000, tiers(eur(10_000), [eur(10_000), eur(750)], [eur(30_000), eur(1_500)], [eur(60_000), eur(2_500)])],
  ["dakkapellen", "wonen", "Dakkapellen", "Dormers", "Prefab en op maat gemaakte dakkapellen.", "Prefab and custom dormers.", "Iemand die een zolder bruikbaar wil maken.", "Someone who wants a usable attic.", 9_000, fixed(eur(600), eur(5_000))],
  ["vloeren", "wonen", "Vloeren", "Flooring", "PVC, laminaat, parket, gietvloeren.", "Vinyl, laminate, parquet, poured floors.", "Iemand die verhuist of een nieuwe vloer zoekt.", "Someone moving or looking for a new floor.", 4_500, pct(1000)],
  ["dekvloeren", "wonen", "Dekvloeren", "Screed floors", "Zandcement en anhydriet dekvloeren, in één dag gelegd.", "Sand-cement and anhydrite screeds, laid in one day.", "Iemand die gaat bouwen, verbouwen of vloerverwarming laat leggen.", "Someone building, renovating or installing underfloor heating.", 3_500, pct(1000)],
  ["isolatie", "wonen", "Isolatie", "Insulation", "Spouw-, vloer- en dakisolatie.", "Cavity, floor and roof insulation.", "Iemand met een koud huis of hoge stookkosten.", "Someone with a cold house or high heating bills.", 3_000, pct(1000)],
  ["interieurbouw", "wonen", "Interieurbouw", "Interior joinery", "Maatkasten, wandmeubels, inloopkasten.", "Fitted wardrobes, wall units, walk-in closets.", "Iemand die zijn huis wil inrichten met maatwerk.", "Someone furnishing their home with custom pieces.", 6_000, pct(1000)],
  ["raambekleding", "wonen", "Gordijnen & raambekleding", "Curtains & blinds", "Gordijnen, jaloezieën, plissés, inmeten en ophangen.", "Curtains, blinds, pleated shades, measured and fitted.", "Iemand die net is verhuisd.", "Someone who just moved.", 2_000, pct(1000)],
  ["zonwering", "wonen", "Zonwering & rolluiken", "Awnings & shutters", "Screens, knikarmschermen, rolluiken, uitvalschermen.", "Screens, awnings, roller shutters.", "Iemand met een warme zuidgevel.", "Someone with a hot south-facing facade.", 3_500, pct(1000)],
  ["glaszetters", "wonen", "Glaszetters", "Glaziers", "HR++ en triple glas, glasschade, glazen wanden.", "Double and triple glazing, glass damage, glass walls.", "Iemand met enkel glas of een gebroken ruit.", "Someone with single glazing or a broken pane.", 2_500, pct(1000)],
  ["garagedeuren", "wonen", "Garagedeuren", "Garage doors", "Sectionaal-, kantel- en roldeuren, elektrisch.", "Sectional, up-and-over and roller doors, motorised.", "Iemand met een oude of kapotte garagedeur.", "Someone with an old or broken garage door.", 2_500, fixed(eur(200), eur(1_000))],
  ["beveiliging", "wonen", "Beveiliging & alarm", "Security & alarms", "Alarmsystemen, camera's, slimme sloten.", "Alarm systems, cameras, smart locks.", "Iemand na een inbraak in de buurt.", "Someone after a break-in nearby.", 1_500, pct(1200)],
  ["domotica", "wonen", "Domotica & smart home", "Smart home", "Slimme verlichting, verwarming en audio in huis.", "Smart lighting, heating and audio at home.", "Iemand die zijn huis slimmer wil maken.", "Someone who wants a smarter home.", 4_000, pct(1000)],
  // Energie & duurzaam
  ["installateurs", "energie", "Installateurs (cv/warmtepomp)", "Installers (heating/heat pumps)", "Cv-ketels, warmtepompen, ventilatie.", "Boilers, heat pumps, ventilation.", "Iemand met een oude cv-ketel of die wil verduurzamen.", "Someone with an old boiler or who wants to go sustainable.", 9_000, pct(800)],
  ["zonnepanelen", "energie", "Zonnepanelen", "Solar panels", "Zonnepanelen en omvormers, complete installatie.", "Solar panels and inverters, fully installed.", "Huiseigenaren met een geschikt dak die hun energierekening omlaag willen.", "Homeowners with a suitable roof who want lower energy bills.", 7_000, tiers(eur(3_000), [eur(3_000), eur(300)], [eur(10_000), eur(500)])],
  ["thuisbatterijen", "energie", "Thuisbatterijen", "Home batteries", "Opslag voor zonnestroom, slim laden en ontladen.", "Storage for solar power, smart charging.", "Iemand met zonnepanelen die meer zelf wil gebruiken.", "Someone with solar panels who wants to use more themselves.", 6_000, fixed(eur(450), eur(3_000))],
  ["laadpalen", "energie", "Laadpalen", "EV chargers", "Thuisladers en zakelijke laadpunten.", "Home chargers and business charge points.", "Iemand die net een elektrische auto heeft.", "Someone who just got an electric car.", 1_800, fixed(eur(175), eur(1_000))],
  ["airco", "energie", "Airco", "Air conditioning", "Split-units, multi-split, koelen en verwarmen.", "Split units, multi-split, cooling and heating.", "Iemand met een warme slaapkamer of zolder.", "Someone with a hot bedroom or attic.", 2_800, pct(1200)],
  // Tuin & buiten
  ["hoveniers", "buiten", "Hoveniers", "Gardeners", "Tuinaanleg, beplanting, onderhoud.", "Garden design, planting, maintenance.", "Iemand die een nieuwe tuin wil of net een huis met tuin kocht.", "Someone who wants a new garden or just bought a house with one.", 6_000, pct(1000)],
  ["bestrating", "buiten", "Bestrating", "Paving", "Opritten, terrassen, sierbestrating.", "Driveways, patios, decorative paving.", "Iemand met een verzakte oprit of een nieuw terras in gedachten.", "Someone with a sunken driveway or planning a new patio.", 5_000, pct(1000)],
  ["schuttingen", "buiten", "Schuttingen & hekwerk", "Fences & gates", "Houten, betonnen en composiet schuttingen, poorten.", "Wooden, concrete and composite fences, gates.", "Iemand met een omgewaaide schutting.", "Someone whose fence blew down.", 2_500, pct(1000)],
  ["overkappingen", "buiten", "Overkappingen & veranda's", "Verandas & canopies", "Aluminium veranda's, glazen schuifwanden, carports.", "Aluminium verandas, glass sliding walls, carports.", "Iemand die langer buiten wil zitten.", "Someone who wants to sit outside longer.", 9_000, fixed(eur(650), eur(4_000))],
  ["zwembaden", "buiten", "Zwembaden & wellness", "Pools & wellness", "Zwembaden, jacuzzi's, buitensauna's.", "Pools, hot tubs, outdoor saunas.", "Iemand met een grote tuin en een wens.", "Someone with a big garden and a wish.", 25_000, tiers(eur(5_000), [eur(5_000), eur(500)], [eur(20_000), eur(1_500)])],
  ["bomen", "buiten", "Boomverzorging", "Tree care", "Bomen kappen, snoeien, stobben frezen.", "Tree felling, pruning, stump grinding.", "Iemand met een te grote boom in de tuin.", "Someone with a tree that has grown too big.", 1_200, pct(1200)],
  // Auto & vervoer
  ["autodealers", "auto", "Autodealers", "Car dealers", "Nieuwe en gebruikte auto's, inruil.", "New and used cars, trade-ins.", "Iemand die binnenkort een andere auto zoekt.", "Someone looking for a different car soon.", 18_000, fixed(eur(400), eur(3_000))],
  ["private-lease", "auto", "Private & zakelijke lease", "Private & business lease", "Leasecontracten voor particulieren en ondernemers.", "Lease contracts for private and business drivers.", "Iemand die zonder grote aankoop wil rijden.", "Someone who wants to drive without a big purchase.", 15_000, fixed(eur(300))],
  ["autoschade-garages", "auto", "Autoschade en garages", "Car repair and garages", "Schadeherstel, onderhoud, APK, banden.", "Body repair, servicing, MOT, tyres.", "Iemand met een deuk, kras of een auto die onderhoud nodig heeft.", "Someone with a dent, scratch or a car due for service.", 1_200, pct(1000)],
  ["auto-detailing", "auto", "Auto-detailing & wrapping", "Car detailing & wrapping", "Poetsen, coaten, wrappen en ramen tinten.", "Polishing, coating, wrapping and window tinting.", "Iemand die zijn auto als nieuw wil.", "Someone who wants their car to look new.", 1_500, pct(1200)],
  ["e-bikes", "auto", "E-bikes & scooters", "E-bikes & scooters", "Elektrische fietsen, speed pedelecs, scooters.", "Electric bikes, speed pedelecs, scooters.", "Iemand die elektrisch naar werk wil.", "Someone who wants to commute electric.", 3_000, fixed(eur(150), eur(1_000))],
  ["campers", "auto", "Campers & caravans", "Campers & caravans", "Verkoop, verhuur en onderhoud.", "Sales, rental and servicing.", "Een stel dat er vaker op uit wil.", "A couple that wants to get away more.", 45_000, fixed(eur(750), eur(10_000))],
  ["verhuizers", "auto", "Verhuizers", "Movers", "Particuliere en zakelijke verhuizingen, opslag.", "Private and business moves, storage.", "Iemand die binnenkort gaat verhuizen.", "Someone moving house soon.", 1_500, pct(1200)],
  // Bruiloft & events
  ["trouwlocaties", "events", "Trouwlocaties", "Wedding venues", "Locaties voor ceremonie, diner en feest.", "Venues for ceremony, dinner and party.", "Een stel dat net verloofd is.", "A couple that just got engaged.", 12_000, tiers(eur(5_000), [eur(5_000), eur(400)], [eur(15_000), eur(800)])],
  ["weddingplanners", "events", "Weddingplanners", "Wedding planners", "Volledige planning of coördinatie op de dag.", "Full planning or on-the-day coordination.", "Een stel dat geen stress wil.", "A couple that wants no stress.", 4_000, pct(1000)],
  ["trouwringen", "events", "Trouwringen & juweliers", "Wedding rings & jewellers", "Trouwringen, verlovingsringen, sieraden op maat.", "Wedding and engagement rings, custom jewellery.", "Iemand die op het punt staat aan te zoeken.", "Someone about to propose.", 2_500, pct(1000)],
  ["bruidsmode", "events", "Bruids- en feestmode", "Bridal & formal wear", "Trouwjurken, maatpakken, gala.", "Wedding dresses, tailored suits, formal wear.", "Een bruid of bruidegom op zoek naar de outfit.", "A bride or groom looking for the outfit.", 2_000, pct(1000)],
  ["cateraars", "events", "Cateraars", "Caterers", "Catering voor feesten, bruiloften en bedrijfsevents.", "Catering for parties, weddings and corporate events.", "Iemand die een feest, bruiloft of bedrijfsuitje organiseert.", "Someone organising a party, wedding or company outing.", 4_000, pct(1000)],
  ["fotografen", "events", "Fotografen & videografen", "Photographers & videographers", "Bruiloften, portretten, bedrijfsfoto's en video.", "Weddings, portraits, corporate photos and video.", "Een stel dat gaat trouwen, of een bedrijf dat nieuwe beelden nodig heeft.", "A couple getting married, or a company that needs new visuals.", 2_000, pct(1200)],
  ["djs", "events", "DJ's & live muziek", "DJs & live music", "DJ's, bands, geluid en licht.", "DJs, bands, sound and lighting.", "Iemand die een feest geeft dat niet saai mag zijn.", "Someone throwing a party that can't be boring.", 1_200, pct(1200)],
  ["feestlocaties", "events", "Feest- en vergaderlocaties", "Party & meeting venues", "Zalen voor verjaardagen, jubilea en bedrijfsevents.", "Venues for birthdays, anniversaries and corporate events.", "Iemand die iets te vieren heeft.", "Someone with something to celebrate.", 3_500, pct(1000)],
  ["partyverhuur", "events", "Partyverhuur", "Party rentals", "Tenten, meubilair, springkussens, foodtrucks.", "Tents, furniture, bouncy castles, food trucks.", "Iemand die een tuinfeest of bedrijfsdag organiseert.", "Someone organising a garden party or company day.", 1_500, pct(1200)],
  // Sport & lifestyle
  ["sportscholen", "sport", "Sportscholen", "Gyms", "Jaarabonnementen, groepslessen.", "Annual memberships, group classes.", "Iemand die wil beginnen met sporten of overstappen.", "Someone who wants to start training or switch gyms.", 600, fixed(eur(100), eur(400))],
  ["personal-trainers", "sport", "Personal trainers", "Personal trainers", "1-op-1 training, voedingsschema's, trajecten.", "1-on-1 training, nutrition plans, programmes.", "Iemand die echt resultaat wil.", "Someone who really wants results.", 1_200, pct(1500)],
  ["vechtsport", "sport", "Vechtsport & boksscholen", "Martial arts & boxing", "Boksen, kickboksen, BJJ, zelfverdediging.", "Boxing, kickboxing, BJJ, self-defence.", "Iemand die zelfvertrouwen en conditie wil.", "Someone who wants confidence and fitness.", 500, fixed(eur(75), eur(300))],
  ["schoonheidssalons", "sport", "Beauty & huidverzorging", "Beauty & skincare", "Behandeltrajecten, laserontharing, huidtherapie.", "Treatment courses, laser hair removal, skin therapy.", "Iemand die een behandeltraject overweegt.", "Someone considering a treatment course.", 1_000, pct(1500)],
  ["tattoo", "sport", "Tattoo & piercing", "Tattoo & piercing", "Custom tattoos, cover-ups, piercings.", "Custom tattoos, cover-ups, piercings.", "Iemand die al lang een tattoo wil.", "Someone who has wanted a tattoo for ages.", 600, pct(1500, 30_000, 5_000)],
  // Zakelijk & tech
  ["webdesign-marketing", "zakelijk", "Webdesign en marketing", "Web design and marketing", "Websites, webshops, online marketing.", "Websites, web shops, online marketing.", "Een ondernemer met een verouderde website.", "A business owner with an outdated website.", 5_000, pct(1200)],
  ["app-ontwikkeling", "zakelijk", "Software & apps", "Software & apps", "Apps, maatwerksoftware, koppelingen.", "Apps, custom software, integrations.", "Een bedrijf dat processen wil automatiseren.", "A company that wants to automate processes.", 20_000, tiers(eur(5_000), [eur(5_000), eur(500)], [eur(20_000), eur(1_500)], [eur(50_000), eur(3_000)])],
  ["it-support", "zakelijk", "IT-beheer & cybersecurity", "IT support & cybersecurity", "Werkplekbeheer, netwerken, back-ups, beveiliging.", "Workplace management, networks, backups, security.", "Een mkb'er die IT-gedoe zat is.", "A small business tired of IT hassle.", 6_000, pct(1000)],
  ["schoonmaakbedrijven", "zakelijk", "Kantoorschoonmaak", "Office cleaning", "Kantoorschoonmaak, glasbewassing, opleveringen.", "Office cleaning, window cleaning, end-of-project cleans.", "Een ondernemer die een schoonmaker zoekt voor zijn pand.", "A business owner looking for a cleaner for their premises.", 3_000, fixed(eur(200), eur(1_000))],
  ["drukwerk", "zakelijk", "Drukwerk & signing", "Print & signage", "Belettering, gevelreclame, drukwerk, beursmateriaal.", "Vehicle lettering, signage, print, trade-show materials.", "Een ondernemer met een nieuw pand of bedrijfsbus.", "A business with new premises or a new van.", 2_000, pct(1200)],
  ["vertalingen", "zakelijk", "Vertaalbureaus", "Translation agencies", "Vertalingen, beëdigde vertalingen, tolken.", "Translations, sworn translations, interpreting.", "Een bedrijf dat de grens over gaat.", "A company going international.", 1_500, pct(1200)],
  // Lessen & opleiding
  ["rijscholen", "leren", "Rijscholen", "Driving schools", "Rijlessen auto en motor, pakketten, spoedopleidingen.", "Car and motorcycle lessons, packages, intensive courses.", "Iemand die net 17 is geworden.", "Someone who just turned 17.", 2_200, fixed(eur(200), eur(1_000))],
  ["bijles", "leren", "Bijles & huiswerkbegeleiding", "Tutoring & homework help", "Bijles, examentraining, huiswerkinstituten.", "Tutoring, exam training, homework centres.", "Ouders van een scholier die een duwtje nodig heeft.", "Parents of a student who needs a push.", 1_200, pct(1500)],
  ["taalcursussen", "leren", "Taalcursussen", "Language courses", "Nederlands, Engels, Spaans en meer, groep of privé.", "Dutch, English, Spanish and more, group or private.", "Iemand die voor werk of liefde een taal wil leren.", "Someone learning a language for work or love.", 900, pct(1500)],
  ["muziekles", "leren", "Muziekles", "Music lessons", "Gitaar, piano, zang, drums, productie.", "Guitar, piano, singing, drums, production.", "Iemand die altijd al een instrument wilde spelen.", "Someone who always wanted to play an instrument.", 800, pct(1500)],
  ["vakopleidingen", "leren", "Cursussen & vakopleidingen", "Courses & vocational training", "Certificaten, bijscholing, bedrijfstrainingen.", "Certificates, upskilling, corporate training.", "Iemand die een volgende stap in zijn carrière wil.", "Someone ready for the next career step.", 2_500, pct(1200)],
  // Diensten aan huis
  ["schoonmaak-particulier", "diensten", "Schoonmaak aan huis", "Home cleaning", "Wekelijkse schoonmaak, voorjaarsschoonmaak, opleveringen.", "Weekly cleaning, spring cleaning, move-out cleans.", "Een druk gezin zonder tijd.", "A busy family with no time.", 1_200, fixed(eur(100), eur(500))],
  ["glazenwassers", "diensten", "Glazenwassers & gevelreiniging", "Window & facade cleaning", "Ramen, gevels, dakgoten, zonnepanelen reinigen.", "Windows, facades, gutters, solar panel cleaning.", "Iemand die al lang naar vieze ramen kijkt.", "Someone tired of dirty windows.", 600, pct(1500, 20_000, 2_500)],
  ["ongediertebestrijding", "diensten", "Ongediertebestrijding", "Pest control", "Muizen, ratten, wespen, bedwantsen.", "Mice, rats, wasps, bed bugs.", "Iemand met een plaag die snel weg moet.", "Someone with a pest that has to go fast.", 400, fixed(eur(50), eur(150))],
  ["slotenmakers", "diensten", "Slotenmakers", "Locksmiths", "Sloten vervangen, inbraakpreventie, buitengesloten.", "Lock replacement, burglary prevention, lockouts.", "Iemand die net is verhuisd of buitengesloten.", "Someone who just moved or is locked out.", 400, fixed(eur(50), eur(150))],
  ["dierenverzorging", "diensten", "Dierenverzorging", "Pet care", "Trimsalons, uitlaatservice, dierenoppas.", "Grooming, dog walking, pet sitting.", "Iemand met een hond en weinig tijd.", "Someone with a dog and little time.", 600, pct(1500, 20_000, 2_500)],
];

export const CATEGORIES: CategoryDef[] = ROWS.map(([slug, group, nameNl, nameEn, descriptionNl, descriptionEn, whoNl, whoEn, jobEur, example]) => ({
  slug, group, nameNl, nameEn, descriptionNl, descriptionEn, whoNl, whoEn, exampleJobCents: jobEur * 100, example,
}));

export const EXCLUDED_CATEGORIES = [
  { slug: "makelaardij", nameNl: "Makelaardij", nameEn: "Real estate brokerage", reasonNl: "Bemiddeling bij woningen kent eigen regels over provisies en belangenverstrengeling.", reasonEn: "Property brokerage has its own rules on commissions and conflicts of interest." },
  { slug: "hypotheken", nameNl: "Hypotheken", nameEn: "Mortgages", reasonNl: "Financieel advies en bemiddeling vallen onder de Wft en het provisieverbod.", reasonEn: "Financial advice and brokerage fall under the Dutch Wft and its commission ban." },
  { slug: "verzekeringen", nameNl: "Verzekeringen", nameEn: "Insurance", reasonNl: "Aanbrengen van verzekeringen is vergunningsplichtig bemiddelen onder de Wft.", reasonEn: "Introducing insurance counts as regulated intermediation under the Wft." },
  { slug: "financiele-producten", nameNl: "Overige financiële producten", nameEn: "Other financial products", reasonNl: "Leningen, beleggingen en vergelijkbare producten vallen onder financieel toezicht.", reasonEn: "Loans, investments and similar products are under financial supervision." },
  { slug: "advocatuur", nameNl: "Advocatuur", nameEn: "Legal services", reasonNl: "Advocaten mogen geen vergoeding betalen voor het aanbrengen van cliënten.", reasonEn: "Lawyers may not pay fees for introducing clients." },
  { slug: "medische-zorg", nameNl: "Medische zorg", nameEn: "Medical care", reasonNl: "Betaald doorverwijzen naar zorgverleners is onwenselijk en deels verboden.", reasonEn: "Paid referral to healthcare providers is undesirable and partly prohibited." },
];
