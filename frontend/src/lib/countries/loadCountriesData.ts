import type { CountriesData } from "../../types/country";

export async function loadCountriesData(): Promise<CountriesData> {
  try {
    const res = await fetch("/api/countries");
    if (res.ok) {
      const data = (await res.json()) as Partial<CountriesData>;
      if (Array.isArray(data.features)) {
        return { features: data.features };
      }
    }
  } catch {
    void 0;
  }

  try {
    const local = await fetch("/datasets/ne_110m_admin_0_countries.geojson");
    const data = (await local.json()) as Partial<CountriesData>;
    return { features: Array.isArray(data.features) ? data.features : [] };
  } catch {
    return { features: [] };
  }
}
