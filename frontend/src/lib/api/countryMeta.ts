export type CountryMetaDto = {
  countryName: string;
  capital: string;
  currency: string;
};

function canQueryByIso(isoA2: string): boolean {
  return /^[A-Za-z]{2}$/.test(isoA2);
}

export async function fetchCountryMeta(
  isoA2: string,
  countryName: string
): Promise<CountryMetaDto | null> {
  const res = canQueryByIso(isoA2)
    ? await fetch(`/api/country-meta/country/${encodeURIComponent(isoA2)}`)
    : await fetch(`/api/country-meta/country/name/${encodeURIComponent(countryName)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`country_meta_http_${res.status}`);
  }
  return (await res.json()) as CountryMetaDto;
}
