export type LandmarkDto = {
  id: string;
  name: string;
};

export function canQueryLandmarksByIso(isoA2: string): boolean {
  return /^[A-Za-z]{2}$/.test(isoA2);
}

export async function fetchLandmarksForCountry(
  isoA2: string,
  countryName: string
): Promise<LandmarkDto[]> {
  const res = canQueryLandmarksByIso(isoA2)
    ? await fetch(`/api/landmarks/country/${encodeURIComponent(isoA2)}`)
    : await fetch(`/api/landmarks/country/name/${encodeURIComponent(countryName)}`);
  if (!res.ok) throw new Error("not found");
  const data = (await res.json()) as { landmarks?: LandmarkDto[] };
  return data.landmarks ?? [];
}
