import { useMemo, useCallback, useState, useEffect } from "react";
import { geoPath, geoMercator } from "d3-geo";
import type { Feature } from "geojson";
import type { CountryWithGeometry } from "../../types/country";
import { countryVisitKey } from "../../lib/visitCountryKey";
import styles from "./CountryModal.module.css";

type Landmark = {
  id: string;
  name: string;
};

const STORAGE_KEY = "travel-tracker-visited-landmarks-v2";

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

function canQueryLandmarksApi(isoA2: string) {
  return /^[A-Za-z]{2}$/.test(isoA2);
}

export default function CountryModal({
  country,
  onClose,
  isCountryVisited,
  onToggleCountryVisited,
}: Props) {
  const code = country.properties.ISO_A2;
  const visitKey = countryVisitKey(country.properties);
  const name = country.properties.ADMIN;
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [landmarksReady, setLandmarksReady] = useState(false);

  const [visited, setVisited] = useState<Set<string>>(() => getVisited());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = canQueryLandmarksApi(code)
          ? await fetch(`/api/landmarks/country/${encodeURIComponent(code)}`)
          : await fetch(`/api/landmarks/country/name/${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error("not found");
        const data: { landmarks: Landmark[] } = await res.json();
        if (!cancelled) setLandmarks(data.landmarks ?? []);
      } catch {
        if (!cancelled) setLandmarks([]);
      } finally {
        if (!cancelled) setLandmarksReady(true);
      }
    }

    setLandmarksReady(false);
    load();
    return () => {
      cancelled = true;
    };
  }, [code, name]);

  const toggleVisited = useCallback(
    (landmark: Landmark) => {
      const key = makeKey(visitKey, landmark.id);
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
    [visitKey]
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
    (landmark: Landmark) => visited.has(makeKey(visitKey, landmark.id)),
    [visitKey, visited]
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
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-[#1a1a1a] ${isCountryVisited ? "bg-neutral-400" : "bg-zinc-600"}`}
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
            {!landmarksReady ? (
              <p className="text-slate-400 text-sm py-4 m-0">Loading landmarks…</p>
            ) : landmarks.length === 0 ? (
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
                        htmlFor={`${visitKey}-${landmark.id}`}
                        className="flex cursor-pointer items-center gap-3 py-4"
                      >
                        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                          <input
                            type="checkbox"
                            id={`${visitKey}-${landmark.id}`}
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
