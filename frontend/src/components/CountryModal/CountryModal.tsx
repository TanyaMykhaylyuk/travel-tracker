import { useMemo, useCallback, useState, useEffect } from "react";
import { geoPath, geoMercator } from "d3-geo";
import type { Feature } from "geojson";
import { LANDMARKS_BY_COUNTRY, type Landmark } from "../../data/landmarks";
import type { CountryWithGeometry } from "../../types/country";
import styles from "./CountryModal.module.css";

const STORAGE_KEY = "travel-tracker-visited";
const CHECK_ICON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpath d='M5 12l5 5L20 7'/%3E%3C/svg%3E\")";

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
};

export default function CountryModal({ country, onClose }: Props) {
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
          <h2 id="modal-title" className={styles.title}>
            {name}
          </h2>
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
                className={styles.countryPath}
                d={svgPath}
              />
            </svg>
          </div>

          <div className={styles.content}>
            <h3 className={styles.sectionTitle}>Notable places</h3>
            {landmarks.length === 0 ? (
              <p className={styles.emptyText}>
                No landmarks listed for this country yet.
              </p>
            ) : (
              <ul className={styles.list}>
                {landmarks.map((landmark) => (
                  <li key={landmark.id} className={styles.listItem}>
                    <input
                      type="checkbox"
                      id={`${code}-${landmark.id}`}
                      checked={isVisited(landmark)}
                      onChange={() => toggleVisited(landmark)}
                      className={styles.checkbox}
                      style={{
                        background: isVisited(landmark) ? "#4a9eff" : "transparent",
                        backgroundImage: isVisited(landmark) ? CHECK_ICON : "none",
                      }}
                    />
                    <label
                      htmlFor={`${code}-${landmark.id}`}
                      className={styles.label}
                    >
                      {landmark.name}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
