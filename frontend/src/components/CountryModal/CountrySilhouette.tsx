import { useId, useMemo } from "react";
import { geoPath, geoMercator } from "d3-geo";
import type { Feature } from "geojson";
import type { CountryGeometry } from "../../types/country";
import {
  COUNTRY_FILL_AURORA,
  COUNTRY_FILL_BRONZE,
  COUNTRY_FILL_COPPER,
  COUNTRY_FILL_GOLD,
  COUNTRY_FILL_OBSIDIAN,
  COUNTRY_FILL_ROSE_METAL,
  COUNTRY_FILL_SILVER,
  DEFAULT_VISITED_COUNTRY_COLOR,
  isFancyShaderCountryFill,
  isHexCountryFill,
  isPlainMetalCountryFill,
  resolveGlobeCountryFill,
} from "../../lib/visitStorage";
import { modalMetallicGradientStops } from "./metallicModalGradient";
import styles from "./CountryModal.module.css";

type Props = {
  geometry: CountryGeometry;
  isCountryVisited: boolean;
  fillColor?: string;
};

const SPARKLE_COOL = [
  { cx: 62, cy: 48, r: 2.1, delay: "0s" },
  { cx: 118, cy: 38, r: 1.5, delay: "0.35s" },
  { cx: 198, cy: 52, r: 1.8, delay: "0.7s" },
  { cx: 154, cy: 88, r: 1.4, delay: "1.1s" },
  { cx: 88, cy: 112, r: 2, delay: "0.2s" },
  { cx: 210, cy: 96, r: 1.6, delay: "0.9s" },
  { cx: 132, cy: 142, r: 1.7, delay: "1.4s" },
  { cx: 72, cy: 156, r: 1.3, delay: "0.55s" },
] as const;

const SPARKLE_WARM = [
  { cx: 58, cy: 52, r: 2.2, delay: "0s" },
  { cx: 124, cy: 42, r: 1.7, delay: "0.4s" },
  { cx: 204, cy: 58, r: 1.9, delay: "0.8s" },
  { cx: 168, cy: 92, r: 1.5, delay: "1.2s" },
  { cx: 96, cy: 108, r: 2.1, delay: "0.15s" },
  { cx: 218, cy: 118, r: 1.6, delay: "1s" },
  { cx: 140, cy: 148, r: 1.8, delay: "1.5s" },
  { cx: 76, cy: 72, r: 1.4, delay: "0.65s" },
] as const;

function fancySparkleClass(stored: string): string {
  switch (stored) {
    case COUNTRY_FILL_SILVER:
      return styles.sparkleSilver;
    case COUNTRY_FILL_GOLD:
      return styles.sparkleGold;
    case COUNTRY_FILL_COPPER:
      return styles.sparkleCopper;
    case COUNTRY_FILL_BRONZE:
      return styles.sparkleBronze;
    case COUNTRY_FILL_AURORA:
      return styles.sparkleAurora;
    case COUNTRY_FILL_ROSE_METAL:
      return styles.sparkleRose;
    case COUNTRY_FILL_OBSIDIAN:
      return styles.sparkleObsidian;
    default:
      return styles.sparkleGold;
  }
}

function coolMetallicLayout(stored: string): boolean {
  return (
    stored === COUNTRY_FILL_SILVER ||
    stored === COUNTRY_FILL_AURORA ||
    stored === COUNTRY_FILL_OBSIDIAN
  );
}

export function CountrySilhouette({ geometry, isCountryVisited, fillColor }: Props) {
  const reactId = useId().replace(/:/g, "");
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

  const fancyStored =
    isCountryVisited && fillColor && isFancyShaderCountryFill(fillColor) ? fillColor : null;
  const plainMetal =
    isCountryVisited && fillColor && isPlainMetalCountryFill(fillColor) ? fillColor : null;

  const metalGradId = `${reactId}-metal`;
  const clipId = `${reactId}-clip`;
  const shades = fancyStored ? modalMetallicGradientStops(resolveGlobeCountryFill(fancyStored)) : null;
  const coolLayout = fancyStored ? coolMetallicLayout(fancyStored) : false;

  const showDefaultPath = !isCountryVisited || !fancyStored;

  return (
    <svg className={styles.svg} width={280} height={200} viewBox="0 0 280 200">
      {fancyStored && shades && (
        <defs>
          <linearGradient
            id={metalGradId}
            x1={coolLayout ? "0%" : "0%"}
            y1={coolLayout ? "0%" : "100%"}
            x2="100%"
            y2={coolLayout ? "100%" : "0%"}
          >
            {coolLayout ? (
              <>
                <stop offset="0%" stopColor={shades.dark} />
                <stop offset="18%" stopColor={shades.face} />
                <stop offset="36%" stopColor={shades.base} />
                <stop offset="44%" stopColor={shades.light} />
                <stop offset="52%" stopColor={shades.base} />
                <stop offset="70%" stopColor={shades.dark} />
                <stop offset="86%" stopColor={shades.face} />
                <stop offset="100%" stopColor={shades.dark} />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor={shades.dark} />
                <stop offset="22%" stopColor={shades.face} />
                <stop offset="40%" stopColor={shades.base} />
                <stop offset="47%" stopColor={shades.light} />
                <stop offset="53%" stopColor={shades.base} />
                <stop offset="72%" stopColor={shades.dark} />
                <stop offset="90%" stopColor={shades.face} />
                <stop offset="100%" stopColor={shades.dark} />
              </>
            )}
          </linearGradient>
          <clipPath id={clipId}>
            <path d={svgPath} />
          </clipPath>
        </defs>
      )}

      {fancyStored && shades && (
        <g clipPath={`url(#${clipId})`}>
          <path d={svgPath} fill={`url(#${metalGradId})`} stroke="none" />
          {(coolLayout ? SPARKLE_COOL : SPARKLE_WARM).map((s, i) => (
            <circle
              key={i}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              className={fancySparkleClass(fancyStored)}
              style={{ animationDelay: s.delay }}
            />
          ))}
        </g>
      )}

      {showDefaultPath && (
        <path
          className={styles.countryPath}
          style={
            isCountryVisited && !fancyStored
              ? {
                  fill: plainMetal
                    ? resolveGlobeCountryFill(plainMetal)
                    : isHexCountryFill(fillColor)
                      ? fillColor
                      : DEFAULT_VISITED_COUNTRY_COLOR,
                }
              : undefined
          }
          d={svgPath}
        />
      )}

      {isCountryVisited && (fancyStored || plainMetal) && (
        <path
          className={styles.countrySilhouetteOutline}
          d={svgPath}
          fill="none"
        />
      )}
    </svg>
  );
}
