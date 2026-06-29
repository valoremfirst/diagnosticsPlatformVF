// Lightweight hex-colour helpers for per-company brand theming.
// Brand colours are user-editable, so we derive tints/shades at runtime
// rather than relying on compile-time Tailwind tokens.

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const int = parseInt(full || "000000", 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** rgba() string at the given alpha (0-1). */
export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Mix a colour toward black (amount<0) or white (amount>0), -1..1. */
export function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const target = amount < 0 ? 0 : 255;
  const t = Math.abs(amount);
  return rgbToHex({
    r: r + (target - r) * t,
    g: g + (target - g) * t,
    b: b + (target - b) * t,
  });
}

/** Relative luminance — used to pick legible text on a brand background. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/** Best-contrast ink colour (near-black or white) for text on `hex`. */
export function readableInk(hex: string): string {
  return luminance(hex) > 0.45 ? "#1A1A1A" : "#FFFFFF";
}

/** CSS custom properties applied to a company-scoped wrapper. */
export function brandVars(hex: string): Record<string, string> {
  return {
    "--brand": hex,
    "--brand-deep": shade(hex, -0.28),
    "--brand-soft": shade(hex, 0.35),
    "--brand-tint": withAlpha(hex, 0.1),
    "--brand-tint-strong": withAlpha(hex, 0.16),
    "--brand-ink": readableInk(hex),
  } as Record<string, string>;
}

/** A curated palette of professional brand colours for the picker. */
export const BRAND_SWATCHES = [
  "#1E4D5A", // teal (default)
  "#2563A8", // corporate blue
  "#3D5AA8", // indigo
  "#6A4C93", // violet
  "#A8434A", // crimson
  "#B8814A", // bronze
  "#3D7A5C", // forest
  "#0F2C36", // midnight
];
