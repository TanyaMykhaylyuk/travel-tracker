import type {
  CountryFeature,
  CountryWithGeometry,
  PolygonCoords,
} from "../../types/country";

const getPolygonBounds = (polygon: PolygonCoords) => {
  const ring = polygon[0] ?? [];
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const [lon, lat] of ring) {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }

  return { minLon, minLat, maxLon, maxLat };
};

const isCrimeaPolygon = (polygon: PolygonCoords) => {
  const { minLon, minLat, maxLon, maxLat } = getPolygonBounds(polygon);
  return minLon >= 32 && maxLon <= 38.5 && minLat >= 44 && maxLat <= 48.5;
};

export function buildGlobePolygonsData(
  countries: CountryFeature[]
): CountryWithGeometry[] {
  const base = countries.filter((feature) => feature.properties.ISO_A2 !== "AQ");
  const features = base.map((feature) => ({ ...(feature as CountryWithGeometry) }));

  const russia = features.find((feature) => feature.properties.ISO_A2 === "RU");
  const ukraine = features.find((feature) => feature.properties.ISO_A2 === "UA");

  if (!russia || !ukraine || russia.geometry.type !== "MultiPolygon") {
    return base as CountryWithGeometry[];
  }

  const crimeaIndex = russia.geometry.coordinates.findIndex(isCrimeaPolygon);
  if (crimeaIndex === -1) {
    return base as CountryWithGeometry[];
  }

  const crimeaPolygon = russia.geometry.coordinates[crimeaIndex];
  const updatedRussiaCoords = russia.geometry.coordinates.filter((_, idx) => idx !== crimeaIndex);

  russia.geometry = {
    type: "MultiPolygon",
    coordinates: updatedRussiaCoords,
  };

  if (ukraine.geometry.type === "Polygon") {
    ukraine.geometry = {
      type: "MultiPolygon",
      coordinates: [ukraine.geometry.coordinates, crimeaPolygon],
    };
  } else {
    ukraine.geometry = {
      type: "MultiPolygon",
      coordinates: [...ukraine.geometry.coordinates, crimeaPolygon],
    };
  }

  return features;
}
