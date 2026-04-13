function scaleRgbHex(hex: string, factor: number): string {
  const h = hex.replace(/^#/, "");
  const ch = (start: number) => {
    const v = Math.round(parseInt(h.slice(start, start + 2), 16) * factor);
    return Math.min(255, Math.max(0, v)).toString(16).padStart(2, "0");
  };
  return `#${ch(0)}${ch(2)}${ch(4)}`;
}

export function modalMetallicGradientStops(baseHex: string): {
  dark: string;
  face: string;
  base: string;
  light: string;
} {
  const base = baseHex.startsWith("#") ? baseHex : `#${baseHex}`;
  return {
    dark: scaleRgbHex(base, 0.52),
    face: scaleRgbHex(base, 0.9),
    base,
    light: scaleRgbHex(base, 1.28),
  };
}
