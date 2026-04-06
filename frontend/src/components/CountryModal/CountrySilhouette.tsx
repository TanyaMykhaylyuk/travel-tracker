import { useMemo } from "react";
import { geoPath, geoMercator } from "d3-geo";
import type { Feature } from "geojson";
import type { CountryGeometry } from "../../types/country";
import styles from "./CountryModal.module.css";

type Props = {
  geometry: CountryGeometry;
  isCountryVisited: boolean;
};

export function CountrySilhouette({ geometry, isCountryVisited }: Props) {
  const svgPath = useMemo(() => {
    const feature: Feature = {
      type: "Feature",
      properties: {},
      geometry: geometry as Feature["geometry"],
    };
    const padding = 20;
    const projection = geoMercator().fitExtent(
      [
        [padding, padding],
        [280 - padding, 200 - padding],
      ],
      feature
    );
    const path = geoPath(projection);
    return path(feature) ?? "";
  }, [geometry]);

  return (
    <div className={styles.svgContainer}>
      <svg className={styles.svg} width={280} height={200} viewBox="0 0 280 200">
        <path
          className={`${styles.countryPath} ${isCountryVisited ? styles.countryPathFilled : ""}`}
          d={svgPath}
        />
      </svg>
    </div>
  );
}
