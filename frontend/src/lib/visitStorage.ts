export const VISITED_COUNTRIES_KEY = "travel-tracker-visited-countries";
export const VISITED_LANDMARKS_KEY = "travel-tracker-visited-landmarks-v2";
export const COUNTRY_FILL_COLORS_KEY = "travel-tracker-country-fill-colors-v1";

export const DEFAULT_VISITED_COUNTRY_COLOR = "#4a9eff";

export const METALLIC_SILVER_BASE_HEX = "#aeb4c4";

export const METALLIC_GOLD_BASE_HEX = "#c9a43a";

export const COUNTRY_FILL_SILVER = "fill:silver";
export const COUNTRY_FILL_GOLD = "fill:gold";
export const COUNTRY_FILL_SILVER_PLAIN = "fill:silver-plain";
export const COUNTRY_FILL_GOLD_PLAIN = "fill:gold-plain";

export const COUNTRY_FILL_COPPER = "fill:copper";
export const COUNTRY_FILL_BRONZE = "fill:bronze";
export const COUNTRY_FILL_AURORA = "fill:aurora";
export const COUNTRY_FILL_ROSE_METAL = "fill:rose-metal";
export const COUNTRY_FILL_OBSIDIAN = "fill:obsidian";

export const METALLIC_COPPER_BASE_HEX = "#c4703a";
export const METALLIC_BRONZE_BASE_HEX = "#9a6b2f";
export const METALLIC_AURORA_BASE_HEX = "#0f9b8e";
export const METALLIC_ROSE_METAL_BASE_HEX = "#c9a0a8";
export const METALLIC_OBSIDIAN_BASE_HEX = "#4a3f63";

const FANCY_SHADER_FILL_VALUES: readonly string[] = [
  COUNTRY_FILL_SILVER,
  COUNTRY_FILL_GOLD,
  COUNTRY_FILL_COPPER,
  COUNTRY_FILL_BRONZE,
  COUNTRY_FILL_AURORA,
  COUNTRY_FILL_ROSE_METAL,
  COUNTRY_FILL_OBSIDIAN,
];

export function isFancyShaderCountryFill(value: string): boolean {
  return FANCY_SHADER_FILL_VALUES.includes(value);
}

export function getFancyShaderSparkleTint(stored: string): [number, number, number] | null {
  switch (stored) {
    case COUNTRY_FILL_SILVER:
      return [1, 1, 1];
    case COUNTRY_FILL_GOLD:
      return [1, 0.94, 0.72];
    case COUNTRY_FILL_COPPER:
      return [1, 0.72, 0.52];
    case COUNTRY_FILL_BRONZE:
      return [1, 0.88, 0.62];
    case COUNTRY_FILL_AURORA:
      return [0.62, 0.98, 0.92];
    case COUNTRY_FILL_ROSE_METAL:
      return [1, 0.78, 0.84];
    case COUNTRY_FILL_OBSIDIAN:
      return [0.78, 0.74, 1];
    default:
      return null;
  }
}

export const SILVER_PLAIN_HEX = "#aab6ca";

export const GOLD_PLAIN_HEX = "#b8922e";

export const COUNTRY_FILL_COPPER_PLAIN = "fill:copper-plain";
export const COUNTRY_FILL_BRONZE_PLAIN = "fill:bronze-plain";
export const COUNTRY_FILL_AURORA_PLAIN = "fill:aurora-plain";
export const COUNTRY_FILL_ROSE_METAL_PLAIN = "fill:rose-metal-plain";
export const COUNTRY_FILL_OBSIDIAN_PLAIN = "fill:obsidian-plain";

export const COPPER_PLAIN_HEX = "#b8623d";
export const BRONZE_PLAIN_HEX = "#8a5f32";
export const AURORA_PLAIN_HEX = "#127f74";
export const ROSE_METAL_PLAIN_HEX = "#b8929a";
export const OBSIDIAN_PLAIN_HEX = "#3f3654";

const PLAIN_METAL_FILL_VALUES: readonly string[] = [
  COUNTRY_FILL_SILVER_PLAIN,
  COUNTRY_FILL_GOLD_PLAIN,
  COUNTRY_FILL_COPPER_PLAIN,
  COUNTRY_FILL_BRONZE_PLAIN,
  COUNTRY_FILL_AURORA_PLAIN,
  COUNTRY_FILL_ROSE_METAL_PLAIN,
  COUNTRY_FILL_OBSIDIAN_PLAIN,
];

export function isPlainMetalCountryFill(value: string): boolean {
  return PLAIN_METAL_FILL_VALUES.includes(value);
}

export function isHexCountryFill(value: string | undefined): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function isStoredCountryFillValue(value: string): boolean {
  if (isFancyShaderCountryFill(value) || isPlainMetalCountryFill(value)) {
    return true;
  }
  return isHexCountryFill(value);
}

export function resolveGlobeCountryFill(stored: string): string {
  if (stored === COUNTRY_FILL_SILVER) return METALLIC_SILVER_BASE_HEX;
  if (stored === COUNTRY_FILL_GOLD) return METALLIC_GOLD_BASE_HEX;
  if (stored === COUNTRY_FILL_COPPER) return METALLIC_COPPER_BASE_HEX;
  if (stored === COUNTRY_FILL_BRONZE) return METALLIC_BRONZE_BASE_HEX;
  if (stored === COUNTRY_FILL_AURORA) return METALLIC_AURORA_BASE_HEX;
  if (stored === COUNTRY_FILL_ROSE_METAL) return METALLIC_ROSE_METAL_BASE_HEX;
  if (stored === COUNTRY_FILL_OBSIDIAN) return METALLIC_OBSIDIAN_BASE_HEX;
  if (stored === COUNTRY_FILL_SILVER_PLAIN) return SILVER_PLAIN_HEX;
  if (stored === COUNTRY_FILL_GOLD_PLAIN) return GOLD_PLAIN_HEX;
  if (stored === COUNTRY_FILL_COPPER_PLAIN) return COPPER_PLAIN_HEX;
  if (stored === COUNTRY_FILL_BRONZE_PLAIN) return BRONZE_PLAIN_HEX;
  if (stored === COUNTRY_FILL_AURORA_PLAIN) return AURORA_PLAIN_HEX;
  if (stored === COUNTRY_FILL_ROSE_METAL_PLAIN) return ROSE_METAL_PLAIN_HEX;
  if (stored === COUNTRY_FILL_OBSIDIAN_PLAIN) return OBSIDIAN_PLAIN_HEX;
  return stored;
}

export function getVisitedCountriesSet(): Set<string> {
  try {
    const stored = localStorage.getItem(VISITED_COUNTRIES_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function saveVisitedCountriesSet(visited: Set<string>): void {
  localStorage.setItem(VISITED_COUNTRIES_KEY, JSON.stringify([...visited]));
}

export function getVisitedLandmarksSet(): Set<string> {
  try {
    const stored = localStorage.getItem(VISITED_LANDMARKS_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function saveVisitedLandmarksSet(visited: Set<string>): void {
  localStorage.setItem(VISITED_LANDMARKS_KEY, JSON.stringify([...visited]));
}

export function hasAnyVisitedLandmarkForCountry(
  countryVisitKey: string,
  visitedLandmarks: Set<string>
): boolean {
  const prefix = `${countryVisitKey}:`;
  for (const k of visitedLandmarks) {
    if (k.startsWith(prefix)) return true;
  }
  return false;
}

export function getCountryFillColors(): Record<string, string> {
  try {
    const stored = localStorage.getItem(COUNTRY_FILL_COLORS_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && isStoredCountryFillValue(v)) {
        out[k] = isHexCountryFill(v) ? v.toLowerCase() : v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function saveCountryFillColors(colors: Record<string, string>): void {
  localStorage.setItem(COUNTRY_FILL_COLORS_KEY, JSON.stringify(colors));
}

export function removeCountryFillColor(countryVisitKey: string): void {
  const next = { ...getCountryFillColors() };
  delete next[countryVisitKey];
  saveCountryFillColors(next);
}

export function pruneCountryFillColors(): void {
  const countries = getVisitedCountriesSet();
  const landmarks = getVisitedLandmarksSet();
  const colors = getCountryFillColors();
  let changed = false;
  const next = { ...colors };
  for (const key of Object.keys(next)) {
    const stillVisited =
      countries.has(key) || hasAnyVisitedLandmarkForCountry(key, landmarks);
    if (!stillVisited) {
      delete next[key];
      changed = true;
    }
  }
  if (changed) saveCountryFillColors(next);
}

export function clearAllVisitData(): void {
  try {
    localStorage.removeItem(VISITED_COUNTRIES_KEY);
    localStorage.removeItem(VISITED_LANDMARKS_KEY);
    localStorage.removeItem(COUNTRY_FILL_COLORS_KEY);
  } catch {
    void 0;
  }
}

export function clearLandmarksForCountry(countryVisitKey: string): void {
  const prefix = `${countryVisitKey}:`;
  const next = new Set(getVisitedLandmarksSet());
  for (const k of next) {
    if (k.startsWith(prefix)) next.delete(k);
  }
  saveVisitedLandmarksSet(next);
}
