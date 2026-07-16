import type { Config } from "tailwindcss";

// Uniemarket theme: all brand colors are wired to CSS variables defined in
// src/index.css (:root). This lets a future theming pass (or a light-mode
// toggle) swap the underlying values without touching any component code.
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        "bg-subtle": "var(--color-bg-subtle)",
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        "surface-3": "var(--color-surface-3)",
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        green: {
          DEFAULT: "var(--color-green)",
          hover: "var(--color-green-hover)",
          press: "var(--color-green-press)",
          soft: "var(--color-green-soft)",
        },
        yellow: {
          DEFAULT: "var(--color-yellow)",
          hover: "var(--color-yellow-hover)",
          soft: "var(--color-yellow-soft)",
        },
        "gold-deep": "var(--color-gold-deep)",
        text: {
          DEFAULT: "var(--color-text)",
          muted: "var(--color-text-muted)",
          subtle: "var(--color-text-subtle)",
          disabled: "var(--color-text-disabled)",
          "on-green": "var(--color-text-on-green)",
          "on-yellow": "var(--color-text-on-yellow)",
        },
        success: "var(--color-success)",
        danger: {
          DEFAULT: "var(--color-danger)",
          soft: "var(--color-danger-soft)",
        },
        warning: "var(--color-warning)",
      },
      fontFamily: {
        heading: ['"Baloo 2"', '"Be Vietnam Pro"', "system-ui", "sans-serif"],
        body: ["Be Vietnam Pro", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        // Primary brand glow: warm lemon-amber.
        "glow-amber": "0 0 0 1px var(--color-yellow), 0 8px 24px -8px rgba(245, 176, 30, 0.16)",
        // Secondary glow: fresh leaf green, kept for success-ish spots.
        "glow-green": "0 0 0 1px var(--color-green), 0 8px 24px -8px rgba(111, 191, 68, 0.14)",
        "glow-yellow": "0 0 0 1px var(--color-yellow), 0 8px 24px -8px rgba(245, 176, 30, 0.16)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
