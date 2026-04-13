import { useEffect, useRef, useState } from "react";
import type { CountryWithGeometry } from "../../types/country";
import { countryVisitKey } from "../../lib/visitCountryKey";
import { DEFAULT_VISITED_COUNTRY_COLOR, isHexCountryFill } from "../../lib/visitStorage";
import { useLandmarksForCountry } from "../../hooks/useLandmarksForCountry";
import { useLandmarkVisits } from "../../hooks/useLandmarkVisits";
import { CountrySilhouette } from "./CountrySilhouette";
import { MAP_FILL_PRESETS } from "./mapFillPresets";
import styles from "./CountryModal.module.css";

type Props = {
  country: CountryWithGeometry;
  visitEpoch: number;
  visitsSyncReady?: boolean;
  onClose: () => void;
  isCountryVisited: boolean;
  onToggleCountryVisited: () => void;
  onLandmarksChanged?: () => void;
  countryFillColor?: string;
  onCountryFillColorChange: (hex: string) => void;
  onCountryFillColorReset: () => void;
};

export default function CountryModal({
  country,
  visitEpoch,
  visitsSyncReady = true,
  onClose,
  isCountryVisited,
  onToggleCountryVisited,
  onLandmarksChanged,
  countryFillColor,
  onCountryFillColorChange,
  onCountryFillColorReset,
}: Props) {
  const code = country.properties.ISO_A2;
  const visitKey = countryVisitKey(country.properties);
  const name = country.properties.ADMIN;
  const [mapColorOpen, setMapColorOpen] = useState(false);
  const mapColorToolsRef = useRef<HTMLDivElement>(null);

  const { landmarks, landmarksReady, landmarksError } = useLandmarksForCountry(code, name);
  const { toggleVisited, isVisited } = useLandmarkVisits(
    visitKey,
    visitEpoch,
    onLandmarksChanged,
    visitsSyncReady
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!mapColorOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const el = mapColorToolsRef.current;
      const target = e.target as Node | null;
      if (el && target && !el.contains(target)) {
        setMapColorOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [mapColorOpen]);

  useEffect(() => {
    setMapColorOpen(false);
  }, [visitKey]);

  useEffect(() => {
    if (!isCountryVisited) setMapColorOpen(false);
  }, [isCountryVisited]);

  const colorInputValue = isHexCountryFill(countryFillColor)
    ? countryFillColor
    : "#64748b";
  const hasCustomMapColor = Boolean(countryFillColor);

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
          <div className={styles.headerMain}>
            <h2 id="modal-title" className={styles.title}>
              {name}
            </h2>
            <div className={styles.headerActionsRow}>
              <div className="flex items-center justify-between gap-4 py-0.5 min-w-0 flex-1">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-white">Visited</span>
                  <span className="text-xs text-slate-400">Mark this country as visited</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isCountryVisited}
                  aria-label="Mark country as visited"
                  disabled={!visitsSyncReady}
                  onClick={onToggleCountryVisited}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-[#1a1a1a] ${visitsSyncReady ? "cursor-pointer" : "cursor-wait opacity-60"} ${isCountryVisited ? "bg-neutral-400" : "bg-zinc-600"}`}
                >
                  <span
                    className={`pointer-events-none absolute left-0.5 top-0.5 inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isCountryVisited ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
              <div ref={mapColorToolsRef} className={styles.headerColorWrap}>
                <button
                  type="button"
                  className={styles.mapColorTrigger}
                  aria-expanded={mapColorOpen}
                  aria-haspopup="dialog"
                  aria-label={
                    isCountryVisited
                      ? "Відкрити палітру кольорів для глобуса"
                      : "Спочатку позначте країну як відвідану"
                  }
                  title={
                    isCountryVisited
                      ? "Колір замальовування на глобусі"
                      : "Увімкніть «Visited», щоб обрати колір для глобуса"
                  }
                  disabled={!visitsSyncReady || !isCountryVisited}
                  onClick={() => isCountryVisited && setMapColorOpen((o) => !o)}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    stroke="currentColor"
                    strokeWidth="1.65"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11.5 3.5c-4.2 0-7.8 2.6-7.8 6.1 0 1.6.9 3 2.4 4l-.95 2.85 2.95-1.05c.9.45 1.95.65 3.05.65 4.2 0 7.75-2.55 7.75-6.05 0-3.55-3.7-6.4-8.5-6.4Z" />
                    <circle cx="8.3" cy="9.4" r="1.2" fill="currentColor" stroke="none" />
                    <circle cx="11.4" cy="7.8" r="1.15" fill="currentColor" stroke="none" />
                    <circle cx="15.1" cy="8.9" r="1.1" fill="currentColor" stroke="none" />
                    <circle cx="16.9" cy="12.3" r="1.05" fill="currentColor" stroke="none" />
                  </svg>
                </button>
                {mapColorOpen && isCountryVisited && (
                  <div
                    className={`${styles.colorPopover} ${styles.colorPopoverAnchored}`}
                    role="dialog"
                    aria-label="Globe fill color"
                  >
                    <p className={styles.colorPopoverTitle}>Globe color</p>
                    <div className={styles.colorSwatchRow}>
                      {MAP_FILL_PRESETS.map((preset) =>
                        preset.kind === "hex" ? (
                          <button
                            key={preset.value}
                            type="button"
                            className={styles.colorSwatch}
                            style={{ backgroundColor: preset.value }}
                            aria-label={`Use color ${preset.value}`}
                            disabled={!visitsSyncReady}
                            onClick={() => {
                              if (preset.value === DEFAULT_VISITED_COUNTRY_COLOR) {
                                onCountryFillColorReset();
                              } else {
                                onCountryFillColorChange(preset.value);
                              }
                            }}
                          />
                        ) : (
                          <button
                            key={preset.value}
                            type="button"
                            className={`${styles.colorSwatch} ${styles[preset.swatchClass]}`}
                            aria-label={preset.label}
                            disabled={!visitsSyncReady}
                            onClick={() => onCountryFillColorChange(preset.value)}
                          />
                        )
                      )}
                    </div>
                    <div className={styles.colorNativeRow}>
                      <input
                        type="color"
                        value={colorInputValue}
                        aria-label="Custom color"
                        disabled={!visitsSyncReady}
                        onChange={(e) => {
                          const v = e.target.value.toLowerCase();
                          if (v === DEFAULT_VISITED_COUNTRY_COLOR) {
                            onCountryFillColorReset();
                          } else {
                            onCountryFillColorChange(v);
                          }
                        }}
                      />
                      <span className={styles.colorNativeLabel}>Custom</span>
                    </div>
                    <button
                      type="button"
                      className={styles.resetColorBtn}
                      disabled={!visitsSyncReady || !hasCustomMapColor}
                      onClick={() => onCountryFillColorReset()}
                    >
                      Reset to default blue
                    </button>
                  </div>
                )}
              </div>
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
            <CountrySilhouette
              geometry={country.geometry}
              isCountryVisited={isCountryVisited}
              fillColor={countryFillColor}
            />
          </div>

          <div className={styles.content}>
            {!landmarksReady ? (
              <p className="text-slate-400 text-sm py-4 m-0">Loading landmarks…</p>
            ) : landmarksError ? (
              <p className="text-amber-200/90 text-sm py-4 m-0 leading-relaxed">{landmarksError}</p>
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
                        className={`flex items-center gap-3 py-4 ${visitsSyncReady ? "cursor-pointer" : "cursor-wait opacity-60"}`}
                      >
                        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                          <input
                            type="checkbox"
                            id={`${visitKey}-${landmark.id}`}
                            checked={checked}
                            disabled={!visitsSyncReady}
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
