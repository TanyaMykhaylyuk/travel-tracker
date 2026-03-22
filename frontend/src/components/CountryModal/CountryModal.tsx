import { useMemo, useCallback, useState, useEffect } from "react";
import { geoPath, geoMercator } from "d3-geo";
import type { Feature } from "geojson";
import { LANDMARKS_BY_COUNTRY, type Landmark } from "../../data/landmarks";
import type { CountryWithGeometry } from "../../types/country";
import styles from "./CountryModal.module.css";

const STORAGE_KEY = "travel-tracker-visited";

function getVisited(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveVisited(visited: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited]));
}

function makeKey(countryCode: string, landmarkId: string) {
  return `${countryCode}:${landmarkId}`;
}

type Props = {
  country: CountryWithGeometry;
  onClose: () => void;
  isCountryVisited: boolean;
  onToggleCountryVisited: () => void;
};

export default function CountryModal({
  country,
  onClose,
  isCountryVisited,
  onToggleCountryVisited,
}: Props) {
  const code = country.properties.ISO_A2;
  const name = country.properties.ADMIN;
  const landmarks = LANDMARKS_BY_COUNTRY[code] ?? [];

  const [visited, setVisited] = useState<Set<string>>(() => getVisited());

  const toggleVisited = useCallback(
    (landmark: Landmark) => {
      const key = makeKey(code, landmark.id);
      setVisited((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        saveVisited(next);
        return next;
      });
    },
    [code]
  );

  const svgPath = useMemo(() => {
    const feature: Feature = {
      type: "Feature",
      properties: {},
      geometry: country.geometry as Feature["geometry"],
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
  }, [country.geometry]);

  const isVisited = useCallback(
    (landmark: Landmark) => visited.has(makeKey(code, landmark.id)),
    [code, visited]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className="flex flex-col gap-1.5">
            <h2 id="modal-title" className={styles.title}>
              {name}
            </h2>
            <div className="flex items-center justify-between gap-4 py-1">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">
                  Visited
                </span>
                <span className="text-xs text-slate-400">
                  Mark this country as visited
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isCountryVisited}
                aria-label="Color country on map"
                onClick={onToggleCountryVisited}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-[#1a1a2e] ${isCountryVisited ? "bg-sky-500" : "bg-slate-600"}`}
              >
                <span
                  className={`pointer-events-none absolute left-0.5 top-0.5 inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isCountryVisited ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.layout}>
          <div className={styles.svgContainer}>
            <svg
              className={styles.svg}
              width={280}
              height={200}
              viewBox="0 0 280 200"
            >
              <path
                className={`${styles.countryPath} ${isCountryVisited ? styles.countryPathFilled : ""}`}
                d={svgPath}
              />
            </svg>
          </div>

          <div className={styles.content}>
            {landmarks.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 m-0">
                No landmarks listed for this country yet.
              </p>
            ) : (
              <ul className="divide-y divide-white/10">
                {landmarks.map((landmark) => {
                  const checked = isVisited(landmark);
                  return (
                    <li key={landmark.id}>
                      <label
                        htmlFor={`${code}-${landmark.id}`}
                        className="flex cursor-pointer items-center gap-3 py-4"
                      >
                        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                          <input
                            type="checkbox"
                            id={`${code}-${landmark.id}`}
                            checked={checked}
                            onChange={() => toggleVisited(landmark)}
                            className="sr-only"
                          />
                          <span
                            className={`absolute inset-0 rounded border ${checked ? "border-transparent bg-black" : "border-slate-500 bg-transparent"}`}
                          />
                          {checked && (
                            <svg className="relative z-10 h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M5 12l5 5L20 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium text-white">{landmark.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
