export async function fetchCountryFactsByName(countryName: string): Promise<string[]> {
  const res = await fetch(`/api/facts/country/name/${encodeURIComponent(countryName)}`);
  const data = (await res.json()) as { facts?: string[]; error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Failed to load facts");
  }
  return Array.isArray(data.facts) ? data.facts : [];
}
