const GLOBE_ADM0_TO_TRAVEL_CCA3: Readonly<Record<string, string>> = {
  PSX: "PSE",
  SDS: "SSD",
};

export function normalizeGlobeAdm0ToTravelCca3(adm0: string): string {
  return GLOBE_ADM0_TO_TRAVEL_CCA3[adm0] ?? adm0;
}
