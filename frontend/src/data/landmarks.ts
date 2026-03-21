export type Landmark = {
  id: string;
  name: string;
};

export const LANDMARKS_BY_COUNTRY: Record<string, Landmark[]> = {
  UA: [
    { id: "kyiv-pechersk", name: "Kyiv Pechersk Lavra" },
    { id: "sofia-kyiv", name: "Saint Sophia's Cathedral" },
    { id: "lviv-old-town", name: "Lviv Old Town" },
    { id: "chernobyl", name: "Chernobyl Exclusion Zone" },
    { id: "odesa-stairs", name: "Potemkin Stairs" },
    { id: "kharkiv-freedom", name: "Freedom Square" },
  ],
  PL: [
    { id: "wawel", name: "Wawel Castle" },
    { id: "warsaw-old", name: "Warsaw Old Town" },
    { id: "auschwitz", name: "Auschwitz-Birkenau" },
    { id: "wieliczka", name: "Wieliczka Salt Mine" },
    { id: "gdansk-crane", name: "Gdańsk Crane" },
  ],
  IT: [
    { id: "colosseum", name: "Colosseum" },
    { id: "vatican", name: "Vatican City" },
    { id: "venice-canal", name: "Venice Canals" },
    { id: "pisa-tower", name: "Leaning Tower of Pisa" },
    { id: "florence-duomo", name: "Florence Cathedral" },
    { id: "milan-duomo", name: "Milan Cathedral" },
  ],
  FR: [
    { id: "eiffel", name: "Eiffel Tower" },
    { id: "louvre", name: "Louvre Museum" },
    { id: "versailles", name: "Palace of Versailles" },
    { id: "mont-saint-michel", name: "Mont Saint-Michel" },
    { id: "notre-dame", name: "Notre-Dame de Paris" },
  ],
  ES: [
    { id: "sagrada", name: "Sagrada Família" },
    { id: "alhambra", name: "Alhambra" },
    { id: "santiago-cathedral", name: "Santiago de Compostela Cathedral" },
    { id: "prado", name: "Prado Museum" },
    { id: "park-guell", name: "Park Güell" },
  ],
  DE: [
    { id: "brandenburg", name: "Brandenburg Gate" },
    { id: "neuschwanstein", name: "Neuschwanstein Castle" },
    { id: "cologne-cathedral", name: "Cologne Cathedral" },
    { id: "reichstag", name: "Reichstag Building" },
    { id: "oktoberfest", name: "Oktoberfest" },
  ],
  GB: [
    { id: "big-ben", name: "Big Ben" },
    { id: "stonehenge", name: "Stonehenge" },
    { id: "tower-bridge", name: "Tower Bridge" },
    { id: "british-museum", name: "British Museum" },
    { id: "windsor", name: "Windsor Castle" },
  ],
  JP: [
    { id: "fuji", name: "Mount Fuji" },
    { id: "kyoto-temple", name: "Kinkaku-ji (Kyoto)" },
    { id: "tokyo-tower", name: "Tokyo Tower" },
    { id: "hiroshima", name: "Hiroshima Peace Memorial" },
    { id: "osaka-castle", name: "Osaka Castle" },
  ],
  US: [
    { id: "statue-liberty", name: "Statue of Liberty" },
    { id: "grand-canyon", name: "Grand Canyon" },
    { id: "yellowstone", name: "Yellowstone National Park" },
    { id: "golden-gate", name: "Golden Gate Bridge" },
    { id: "disneyland", name: "Disneyland" },
  ],
  TR: [
    { id: "hagia-sophia", name: "Hagia Sophia" },
    { id: "cappadocia", name: "Cappadocia" },
    { id: "pamukkale", name: "Pamukkale" },
    { id: "ephesus", name: "Ephesus" },
  ],
  GR: [
    { id: "acropolis", name: "Acropolis" },
    { id: "santorini", name: "Santorini" },
    { id: "meteora", name: "Meteora" },
    { id: "delphi", name: "Delphi" },
  ],
  NL: [
    { id: "anne-frank", name: "Anne Frank House" },
    { id: "keukenhof", name: "Keukenhof" },
    { id: "zaanse-schans", name: "Zaanse Schans" },
    { id: "rijksmuseum", name: "Rijksmuseum" },
  ],
  PT: [
    { id: "belem-tower", name: "Belém Tower" },
    { id: "sintra", name: "Sintra" },
    { id: "douro", name: "Douro Valley" },
    { id: "lisbon-tram", name: "Tram 28 (Lisbon)" },
  ],
  AT: [
    { id: "schonbrunn", name: "Schönbrunn Palace" },
    { id: "hallstatt", name: "Hallstatt" },
    { id: "salzburg-fortress", name: "Hohensalzburg Fortress" },
  ],
  CZ: [
    { id: "prague-castle", name: "Prague Castle" },
    { id: "charles-bridge", name: "Charles Bridge" },
    { id: "cesky-krumlov", name: "Český Krumlov" },
  ],
  HU: [
    { id: "parliament-budapest", name: "Hungarian Parliament (Budapest)" },
    { id: "chain-bridge", name: "Chain Bridge" },
    { id: "thermal-baths", name: "Thermal Baths" },
  ],
};
