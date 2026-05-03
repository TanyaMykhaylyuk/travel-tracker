import { useId } from "react";

type VisitedCountriesProgressRingProps = {
  percent: number;
  visited: number;
  total: number;
  className?: string;
};

const R = 38;
const C = 2 * Math.PI * R;

export function VisitedCountriesProgressRing({
  percent,
  visited,
  total,
  className = "",
}: VisitedCountriesProgressRingProps) {
  const gradId = useId().replace(/:/g, "");
  const clamped = Math.max(0, Math.min(100, percent));
  const dash = (clamped / 100) * C;

  return (
    <div
      className={`flex flex-col items-center ${className}`}
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
  );
}
