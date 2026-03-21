export type CountryProps = {
  ISO_A2: string;
  ADMIN: string;
  GDP_MD_EST: number;
  POP_EST: number;
};

export type Position = [number, number];
export type PolygonCoords = Position[][];
export type MultiPolygonCoords = PolygonCoords[];

export type CountryGeometry =
  | { type: "Polygon"; coordinates: PolygonCoords }
  | { type: "MultiPolygon"; coordinates: MultiPolygonCoords };

export type CountryFeature = {
  properties: CountryProps;
};

export type CountryWithGeometry = CountryFeature & {
  geometry: CountryGeometry;
};

export type CountriesData = {
  features: CountryFeature[];
};
