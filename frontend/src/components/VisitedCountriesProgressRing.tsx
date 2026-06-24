import { Info } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type VisitedCountriesProgressRingProps = {
  percent: number;
  visited: number;
  total: number;
  className?: string;
};

const R = 38;
const C = 2 * Math.PI * R;

const UN_MEMBER_STATES_URL = "https://www.un.org/en/about-us/member-states";

export function VisitedCountriesProgressRing({
  percent,
  visited,
  total,
  className = "",
}: VisitedCountriesProgressRingProps) {
  const gradId = useId().replace(/:/g, "");
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const clamped = Math.max(0, Math.min(100, percent));
  const dash = (clamped / 100) * C;

  useEffect(() => {
    if (!infoOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInfoOpen(false);
    };
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(e.target as Node)) {
        setInfoOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [infoOpen]);

  return (
    <div className={`w-fit shrink-0 ${className}`}>
      <div ref={rootRef} className="relative flex flex-col items-center">
        <button
          type="button"
          className="absolute right-0 top-0 z-10 flex h-5 w-5 -translate-y-1 translate-x-1 items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/90 text-slate-400 transition hover:border-cyan-400/60 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-400"
          aria-label="How countries are counted"
          aria-expanded={infoOpen}
          aria-controls={popoverId}
          onClick={() => setInfoOpen((open) => !open)}
        >
          <Info className="h-3 w-3" strokeWidth={2.25} aria-hidden />
        </button>

        {infoOpen && (
          <div
            id={popoverId}
            role="dialog"
            aria-labelledby={`${popoverId}-title`}
            className="absolute bottom-full right-0 z-20 mb-2 w-72 max-w-[calc(100vw-3rem)] rounded-xl border border-slate-700/90 bg-slate-950/95 px-3.5 py-3 text-left text-xs leading-relaxed text-slate-300 shadow-xl backdrop-blur-sm"
          >
            <p id={`${popoverId}-title`} className="text-sm font-medium text-cyan-100">
              What counts toward {total}?
            </p>
            <p className="mt-2">
              Your progress includes <strong className="font-medium text-slate-100">195</strong>{" "}
              internationally recognized sovereign states:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-400">
              <li>
                <strong className="font-medium text-slate-200">193</strong> UN Member States
              </li>
              <li>
                <strong className="font-medium text-slate-200">+2</strong> permanent UN observers:
                the Holy See (Vatican City) and the State of Palestine
              </li>
            </ul>
            <p className="mt-2">
              See the official list on the{" "}
              <a
                href={UN_MEMBER_STATES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 underline decoration-cyan-500/40 underline-offset-2 transition hover:text-cyan-200"
              >
                UN Member States
              </a>{" "}
              page.
            </p>
            <p className="mt-2 text-slate-500">
              Regions marked <strong className="font-medium text-slate-400">(disputed)</strong> on
              the map can be tracked separately but are not included in this total.
            </p>
          </div>
        )}

        <div
          className="flex flex-col items-center"
          role="img"
          aria-label={`Countries visited: ${clamped} percent, ${visited} of ${total}`}
        >
          <div className="relative h-[104px] w-[104px]">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 88 88" aria-hidden>
              <circle
                cx="44"
                cy="44"
                r={R}
                fill="none"
                stroke="rgba(15, 23, 42, 0.95)"
                strokeWidth="9"
                className="drop-shadow-[0_0_6px_rgba(0,0,0,0.5)]"
              />
              <circle
                cx="44"
                cy="44"
                r={R}
                fill="none"
                stroke={`url(#visitedRingGrad-${gradId})`}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${C}`}
                className="transition-[stroke-dasharray] duration-500 ease-out"
              />
              <defs>
                <linearGradient id={`visitedRingGrad-${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-semibold tabular-nums text-cyan-100 drop-shadow-sm">
                {clamped}%
              </span>
              <span className="text-[10px] leading-tight text-slate-400">
                {visited} / {total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
