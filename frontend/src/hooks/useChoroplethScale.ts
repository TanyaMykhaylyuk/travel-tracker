import { useMemo } from "react";
import { scaleSequentialSqrt } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import type { CountryFeature } from "../types/country";

function getVal(feat: CountryFeature) {
  return feat.properties.GDP_MD_EST / Math.max(1e5, feat.properties.POP_EST);
}

export function useChoroplethScale(features: CountryFeature[]) {
  return useMemo(() => {
    const values = features.map(getVal).filter(Number.isFinite);
    const maxVal = values.length ? Math.max(...values) : 1;
    const colorScale = scaleSequentialSqrt(interpolateYlOrRd).domain([0, maxVal]);
    return { getVal, colorScale, maxVal };
  }, [features]);
}
