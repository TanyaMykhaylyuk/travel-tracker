import { useEffect } from "react";
import type { CountryFeature } from "../../types/country";
import { useLandmarksForCountry } from "../../hooks/useLandmarksForCountry";
import { getCountryMeta } from "../../lib/countryMeta";

type Props = {
  country: CountryFeature;
  onClose: () => void;
};

export function TripSuggestionModal({ country, onClose }: Props) {
  const isoA2 = country.properties.ISO_A2;
  const name = country.properties.ADMIN;
  const { landmarks, landmarksReady, landmarksError } = useLandmarksForCountry(isoA2, name);
  const meta = getCountryMeta(name);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-end pr-6 sm:pr-10"
      role="dialog"
      aria-modal="false"
      aria-labelledby="trip-suggestion-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cyan-300/70 bg-slate-950/90 text-cyan-50 shadow-[0_0_10px_rgba(34,211,238,0.8),0_0_28px_rgba(56,189,248,0.55),inset_0_0_18px_rgba(34,211,238,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-cyan-300/30 px-6 py-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">
              Your next trip
            </p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2
                id="trip-suggestion-title"
                className="text-2xl font-semibold text-white"
              >
                {name}
              </h2>
              {meta && (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs sm:text-sm text-cyan-100/90">
                  <span>
                    <span className="font-semibold text-cyan-200">Capital:</span>{" "}
                    {meta.capital}
                  </span>
                  <span>
                    <span className="font-semibold text-cyan-200">Currency:</span>{" "}
                    {meta.currency}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-300/60 text-cyan-100 transition hover:border-cyan-200 hover:text-white hover:shadow-[0_0_10px_rgba(34,211,238,0.8)]"
          >
            ×
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          <p className="text-sm font-medium text-cyan-200/90">Must-see landmarks</p>
          {!landmarksReady ? (
            <p className="mt-3 text-sm text-cyan-100/70">Loading landmarks…</p>
          ) : landmarksError ? (
            <p className="mt-3 text-sm text-amber-200/90">{landmarksError}</p>
          ) : landmarks.length === 0 ? (
            <p className="mt-3 text-sm text-cyan-100/70">
              No landmarks listed for this country yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {landmarks.map((landmark) => (
                <li
                  key={landmark.id}
                  className="flex items-start gap-3 rounded-lg border border-cyan-300/20 bg-cyan-500/5 px-3 py-2 text-sm text-cyan-50"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(34,211,238,0.9)]"
                  />
                  <span>{landmark.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
