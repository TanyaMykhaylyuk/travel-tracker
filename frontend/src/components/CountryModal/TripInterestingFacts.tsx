import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getCountryFacts } from "../../lib/countryFacts";

const PLACEHOLDER_TEXT = "Interesting facts will appear here";

const FONT_PRESETS: { fz: number; lh: number }[] = [
  { fz: 16, lh: 1.65 },
  { fz: 15, lh: 1.52 },
  { fz: 14, lh: 1.45 },
  { fz: 13, lh: 1.38 },
  { fz: 12, lh: 1.32 },
  { fz: 11, lh: 1.28 },
  { fz: 10, lh: 1.24 },
];

const MIN_SCALE = 0.48;

type Fit = {
  fontPx: number;
  lh: number;
  scale: number;
  boxH: number;
  boxW: number;
};

const defaultFit: Fit = {
  fontPx: 16,
  lh: 1.65,
  scale: 1,
  boxH: 0,
  boxW: 0,
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

  p.style.transform = "";
  p.style.position = "relative";
  p.style.inset = "";

  let chosen = FONT_PRESETS[FONT_PRESETS.length - 1]!;
  for (const preset of FONT_PRESETS) {
    p.style.fontSize = `${preset.fz}px`;
    p.style.lineHeight = String(preset.lh);
    if (p.scrollHeight <= maxH && p.scrollWidth <= maxW) {
      chosen = preset;
      break;
    }
  }

  p.style.fontSize = `${chosen.fz}px`;
  p.style.lineHeight = String(chosen.lh);

  const naturalH = p.scrollHeight;
  const naturalW = p.scrollWidth;
  const scale = Math.min(
    1,
    Math.max(
      MIN_SCALE,
      Math.min(maxH / Math.max(naturalH, 1), maxW / Math.max(naturalW, 1))
    )
  );

  return {
    fontPx: chosen.fz,
    lh: chosen.lh,
    scale,
    boxH: naturalH * scale,
    boxW: naturalW * scale,
  };
}

export function TripInterestingFacts({ tripResetKey, countryName }: Props) {
  const [displayed, setDisplayed] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const outerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [fit, setFit] = useState<Fit>(defaultFit);

  const fullText = useMemo(() => {
    if (!tripResetKey || !countryName) return PLACEHOLDER_TEXT;
    const facts = getCountryFacts(countryName);
    if (facts.length === 0) return PLACEHOLDER_TEXT;
    return facts.join("\n\n");
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

  const scaled = fit.scale < 0.999;

  return (
    <div
      ref={outerRef}
      className="pointer-events-none fixed bottom-6 left-6 z-30 flex max-h-[min(85dvh,calc(100dvh-4.5rem))] w-[min(28rem,calc(100vw-3rem))] flex-col justify-end overflow-hidden"
      aria-live="polite"
    >
      <div
        className="flex min-h-0 flex-col justify-end"
        style={
          scaled
            ? {
                height: fit.boxH,
                width: fit.boxW,
                maxWidth: "100%",
                overflow: "hidden",
                position: "relative",
              }
            : undefined
        }
      >
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
            transform: scaled ? `scale(${fit.scale})` : undefined,
            transformOrigin: "left bottom",
            position: scaled ? "absolute" : "relative",
            bottom: scaled ? 0 : undefined,
            left: scaled ? 0 : undefined,
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
