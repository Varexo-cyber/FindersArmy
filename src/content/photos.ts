/**
 * Stock photos (Unsplash License, see public/photos/CREDITS.md). Real people and real work make
 * the offer concrete; swap them for photos of actual Finders and businesses once there are any.
 */
export interface Photo {
  src: string;
  /** Unsplash photo id, for attribution. */
  id: string;
  alt: { nl: string; en: string };
}

const p = (file: string, id: string, nl: string, en: string): Photo => ({ src: `/photos/${file}.jpg`, id, alt: { nl, en } });

export const PHOTOS = {
  vriendenStraat: p("vrienden-straat", "1543807535-eceef0bc6599", "Drie vrienden lachen samen op straat", "Three friends laughing together in the street"),
  vriendenLachen: p("vrienden-lachen", "1491438590914-bc09fcaaf77a", "Vrienden lachen samen", "Friends laughing together"),
  jongenLacht: p("jongen-lacht", "1522529599102-193c0d76b5b6", "Jongen lacht in de camera", "Young man smiling"),
  meisjeLacht: p("meisje-lacht", "1517841905240-472988babdf9", "Meisje in spijkerjas lacht", "Young woman in a denim jacket smiling"),
  groep: p("groep", "1517486808906-6ca8b3f04846", "Groep jongeren zit samen buiten", "Group of young people sitting outside"),
  vriendenTafel: p("vrienden-tafel", "1543269865-cbf427effbad", "Vrienden praten aan tafel", "Friends talking at a table"),
  bedrijf: p("bedrijf-highfive", "1600880292203-757bb62b4baf", "Twee ondernemers geven elkaar een high five", "Two business owners high-fiving"),
  auto: p("auto", "1494976388531-d1058494cdd8", "Zwarte sportauto", "Black sports car"),
  rijles: p("rijles", "1549317661-bd32c8ce0db2", "Kleine blauwe auto in de straat", "Small blue car in the street"),
  keuken: p("keuken", "1556911220-bff31c812dba", "Nieuwe witte keuken", "New white kitchen"),
  koppelKeuken: p("koppel-keuken", "1556909114-f6e7ad7d3136", "Stel kookt samen in de keuken", "Couple cooking together"),
  schilder: p("schilder", "1562259949-e8e7689d7828", "Verfroller op een muur", "Paint roller on a wall"),
  zonnepanelen: p("zonnepanelen", "1509391366360-2e959784a276", "Zonnepanelen in een veld", "Solar panels in a field"),
  badkamer: p("badkamer", "1584622650111-993a426fbf0a", "Nieuwe badkamer", "New bathroom"),
  tuin: p("tuin", "1558904541-efa843a96f01", "Strak gemaaid gazon", "Freshly mown lawn"),
  bruiloft: p("bruiloft", "1519741497674-611481863552", "Bruid met boeket", "Bride with bouquet"),
  sportschool: p("sportschool", "1534438327276-14e5300c3a48", "Sportschool met dumbbells", "Gym with dumbbells"),
  timmerman: p("timmerman", "1589939705384-5185137a7f0f", "Vakman aan het werk", "Tradesperson at work"),
  huis: p("huis", "1600585154340-be6161a56a0c", "Modern huis met tuin", "Modern house with garden"),
  winkel: p("winkel", "1441986300917-64674bd600d8", "Kledingwinkel van binnen", "Inside a clothing store"),
  restaurant: p("restaurant", "1517248135467-4c7edcad34c4", "Restaurant met gedekte tafels", "Restaurant with set tables"),
  reizen: p("reizen", "1469854523086-cc02fe5d8800", "Busje op een lege weg", "Van on an empty road"),
  kantoor: p("kantoor", "1497366216548-37526070297c", "Modern kantoor", "Modern office"),
  telefoon: p("telefoon", "1512941937669-90a1b58e7e9c", "Smartphone met apps", "Smartphone with apps"),
  bouw: p("bouw", "1504307651254-35680f356dfd", "Bouwplaats van bovenaf", "Construction site from above"),
} as const;

/** Featured categories with a photo: what one deal earns you. */
export const TIP_TILES: { slug: string; photo: Photo }[] = [
  { slug: "autodealers", photo: PHOTOS.auto },
  { slug: "keukens", photo: PHOTOS.keuken },
  { slug: "zonnepanelen", photo: PHOTOS.zonnepanelen },
  { slug: "badkamers", photo: PHOTOS.badkamer },
  { slug: "trouwlocaties", photo: PHOTOS.bruiloft },
  { slug: "schilders", photo: PHOTOS.schilder },
  { slug: "rijscholen", photo: PHOTOS.rijles },
  { slug: "personal-trainers", photo: PHOTOS.sportschool },
];

const GROUP_PHOTO: Record<string, Photo> = {
  wonen: PHOTOS.timmerman,
  energie: PHOTOS.zonnepanelen,
  buiten: PHOTOS.tuin,
  auto: PHOTOS.auto,
  events: PHOTOS.bruiloft,
  sport: PHOTOS.sportschool,
  zakelijk: PHOTOS.kantoor,
  winkels: PHOTOS.winkel,
  horeca: PHOTOS.restaurant,
  reizen: PHOTOS.reizen,
  leren: PHOTOS.rijles,
  diensten: PHOTOS.huis,
};

const CATEGORY_PHOTO: Record<string, Photo> = Object.fromEntries(TIP_TILES.map((t) => [t.slug, t.photo]));

export function photoForCategory(slug: string, group: string): Photo {
  return CATEGORY_PHOTO[slug] ?? GROUP_PHOTO[group] ?? PHOTOS.huis;
}

export function photoForGroup(group: string): Photo {
  return GROUP_PHOTO[group] ?? PHOTOS.huis;
}
