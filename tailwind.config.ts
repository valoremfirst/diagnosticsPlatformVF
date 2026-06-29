import type { Config } from "tailwindcss";

/**
 * Design tokens derived from the Oracle "Wireframes & Designs" mock.
 * Warm cream canvas, deep-teal primary, serif display accents and a
 * muted, sophisticated multi-hue data-visualisation palette.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        canvas: "#FAFAF7",
        surface: "#FFFFFF",
        "surface-muted": "#F5F3EE",
        "surface-sunken": "#F8F5EE",
        // Borders / hairlines
        line: "#E8E6E0",
        "line-strong": "#D4D1C8",
        // Text / ink
        ink: "#1A1A1A",
        "ink-soft": "#4A4A4A",
        "ink-muted": "#767676",
        "ink-faint": "#A8A6A0",
        // Brand teal
        teal: {
          DEFAULT: "#1E4D5A",
          600: "#1E4D5A",
          500: "#2E6B7A",
          400: "#4A8A99",
          tint: "#E8F0F2",
          deep: "#0F2C36",
          glow: "#3A8794",
        },
        // Semantic / data-viz accents
        positive: "#3D7A5C",
        sage: "#7AB89A",
        amber: "#B8814A",
        gold: "#C9874A",
        sand: "#D4A865",
        danger: "#A84A3D",
        indigo: "#5C6FA8",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,26,26,0.04), 0 1px 8px rgba(26,26,26,0.03)",
        "card-hover": "0 2px 4px rgba(26,26,26,0.06), 0 8px 24px rgba(26,26,26,0.06)",
        rail: "0 1px 3px rgba(26,26,26,0.05)",
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", opacity: "0.7" },
          "70%": { transform: "scale(1.3)", opacity: "0" },
          "100%": { transform: "scale(1.3)", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-in": "fade-in 0.35s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
