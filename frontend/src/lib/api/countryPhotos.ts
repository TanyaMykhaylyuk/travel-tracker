export type CountryPhotoDto = {
  id: string;
  dataUrl: string;
  createdAt: string;
};

export type CountryPhotosResponse = {
  userId: string;
  countryCode: string;
  countryName: string;
  photos: CountryPhotoDto[];
};

type ApiError = { error?: string };

function normalizeCountryCode(countryCode: string): string {
  return countryCode.trim().toUpperCase();
}

export async function fetchCountryPhotos(
  userId: string,
  countryCode: string
): Promise<CountryPhotosResponse> {
  const res = await fetch(
    `/api/users/${encodeURIComponent(userId)}/countries/${encodeURIComponent(normalizeCountryCode(countryCode))}/photos`
  );
  const data = (await res.json()) as CountryPhotosResponse & ApiError;
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Failed to load country photos");
  }
  return data;
}

export async function addCountryPhoto(
  userId: string,
  countryCode: string,
  body: { countryName: string; dataUrl: string }
): Promise<CountryPhotosResponse> {
  const res = await fetch(
    `/api/users/${encodeURIComponent(userId)}/countries/${encodeURIComponent(normalizeCountryCode(countryCode))}/photos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const data = (await res.json()) as CountryPhotosResponse & ApiError;
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Failed to save country photo");
  }
  return data;
}

export async function patchCountryPhotos(
  userId: string,
  countryCode: string,
  photoIds: string[]
): Promise<CountryPhotosResponse> {
  const res = await fetch(
    `/api/users/${encodeURIComponent(userId)}/countries/${encodeURIComponent(normalizeCountryCode(countryCode))}/photos`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoIds }),
    }
  );
  const data = (await res.json()) as CountryPhotosResponse & ApiError;
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Failed to update country photos");
  }
  return data;
}
