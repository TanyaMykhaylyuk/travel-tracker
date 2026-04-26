import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { fetchCountryFactsByName } from "../../lib/countryFactsApi";

const PLACEHOLDER_TEXT = "Interesting facts will appear here";

const MAX_FONT_PX = 16;
const MIN_FONT_PX = 7;

type Fit = {
  fontPx: number;
  lh: number;
};

const defaultFit: Fit = {
  fontPx: 16,
  lh: 1.65,
};

type Props = {
  tripResetKey: string | null;
  countryName: string | null;
};

function viewportFactsMaxHeightPx(): number {
  const h = window.visualViewport?.height ?? window.innerHeight;
  return Math.min(h * 0.85, h - 72);
}

function measureParagraphFit(
  outer: HTMLDivElement,
  p: HTMLParagraphElement
): Fit | null {
  const maxH = viewportFactsMaxHeightPx();
  const maxW = outer.clientWidth;
  if (maxH < 8 || maxW < 8) return null;

  const lineHeightFor = (fontPx: number) => {
    const t = (fontPx - MIN_FONT_PX) / (MAX_FONT_PX - MIN_FONT_PX);
    return 1.16 + t * (1.65 - 1.16);
  };

  const fits = (fontPx: number) => {
    p.style.fontSize = `${fontPx}px`;
    p.style.lineHeight = String(lineHeightFor(fontPx));
    return p.scrollHeight <= maxH && p.scrollWidth <= maxW;
  };

  let low = MIN_FONT_PX;
  let high = MAX_FONT_PX;
  let best = MIN_FONT_PX;

  while (high - low > 0.25) {
    const mid = (low + high) / 2;
    if (fits(mid)) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  p.style.fontSize = `${best}px`;
  p.style.lineHeight = String(lineHeightFor(best));

  return {
    fontPx: best,
    lh: lineHeightFor(best),
  };
}

export function TripInterestingFacts({ tripResetKey, countryName }: Props) {
  const [displayed, setDisplayed] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const [factsText, setFactsText] = useState(PLACEHOLDER_TEXT);
  const outerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [fit, setFit] = useState<Fit>(defaultFit);

  const fullText = useMemo(() => {
    if (!tripResetKey || !countryName) return PLACEHOLDER_TEXT;
    return factsText;
  }, [tripResetKey, countryName, factsText]);

  useEffect(() => {
    if (!tripResetKey || !countryName) {
      setFactsText(PLACEHOLDER_TEXT);
      return;
    }

    let cancelled = false;
    void fetchCountryFactsByName(countryName)
      .then((facts) => {
        if (cancelled) return;
        setFactsText(facts.length ? facts.join("\n\n") : PLACEHOLDER_TEXT);
      })
      .catch(() => {
        if (cancelled) return;
        setFactsText(PLACEHOLDER_TEXT);
      });

    return () => {
      cancelled = true;
    };
  }, [tripResetKey, countryName]);

  const applyFit = useCallback(() => {
    const outer = outerRef.current;
    const p = textRef.current;
    if (!outer || !p || !tripResetKey) return;
    const next = measureParagraphFit(outer, p);
    if (next) setFit(next);
  }, [tripResetKey]);

  useEffect(() => {
    if (!tripResetKey) {
      setDisplayed("");
      setTypingDone(false);
      return;
    }
    setDisplayed("");
    setTypingDone(false);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setDisplayed(fullText.slice(0, i));
      if (i >= fullText.length) {
        setTypingDone(true);
        window.clearInterval(id);
      }
    }, 42);
    return () => window.clearInterval(id);
  }, [tripResetKey, fullText]);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(applyFit);
    return () => cancelAnimationFrame(id);
  }, [applyFit, displayed, fullText, typingDone]);

  useLayoutEffect(() => {
    if (!tripResetKey) return;
    const outer = outerRef.current;
    if (!outer) return;
    const ro = new ResizeObserver(() => applyFit());
    ro.observe(outer);
    window.addEventListener("resize", applyFit);
    window.visualViewport?.addEventListener("resize", applyFit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", applyFit);
      window.visualViewport?.removeEventListener("resize", applyFit);
    };
  }, [tripResetKey, applyFit]);

  if (!tripResetKey) return null;

  return (
    <div
      ref={outerRef}
      className="pointer-events-none fixed bottom-6 left-6 z-30 flex max-h-[min(85dvh,calc(100dvh-4.5rem))] w-[min(28rem,calc(100vw-3rem))] flex-col justify-end overflow-hidden"
      aria-live="polite"
    >
      <div className="flex min-h-0 flex-col justify-end">
        <p
          ref={textRef}
          className="whitespace-pre-wrap font-mono tracking-wide"
          style={{
            color: "#67e8f9",
            fontSize: `${fit.fontPx}px`,
            lineHeight: fit.lh,
            maxWidth: "100%",
            textShadow:
              "0 0 6px rgba(34, 211, 238, 0.95), 0 0 14px rgba(56, 189, 248, 0.75), 0 0 24px rgba(34, 211, 238, 0.45)",
          }}
        >
          {displayed}
          {!typingDone && (
            <span
              className="ml-0.5 inline-block w-2 animate-pulse"
              style={{
                color: "#a5f3fc",
                textShadow: "0 0 8px rgba(165, 243, 252, 0.9)",
              }}
              aria-hidden
            >
              ▌
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
