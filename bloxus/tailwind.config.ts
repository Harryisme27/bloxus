import type { Config } from "tailwindcss";

// Bloxus theme: all brand colors are wired to CSS variables defined in
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
        // Vàng chanh của chữ "US" trong logo — dùng cho sao đánh giá, chữ nhấn.
        lemon: {
          DEFAULT: "var(--color-lemon)",
          hover: "var(--color-lemon-hover)",
          soft: "var(--color-lemon-soft)",
        },
        "gold-deep": "var(--color-gold-deep)",
        text: {
          DEFAULT: "var(--color-text)",
          muted: "var(--color-text-muted)",
          subtle: "var(--color-text-subtle)",
          disabled: "var(--color-text-disabled)",
          "on-green": "var(--color-text-on-green)",
          "on-yellow": "var(--color-text-on-yellow)",
          "on-lemon": "var(--color-text-on-lemon)",
        },
        success: "var(--color-success)",
        danger: {
          DEFAULT: "var(--color-danger)",
          soft: "var(--color-danger-soft)",
        },
        warning: "var(--color-warning)",
      },
      fontFamily: {
        heading: ["Arial", "Helvetica", "sans-serif"],
        body: ["Arial", "Helvetica", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        // Quầng sáng màu chính (xanh lá logo). Tên "amber" giữ lại cho khỏi sửa class.
        "glow-amber": "0 0 0 1px var(--color-yellow), 0 8px 24px -8px rgba(124, 195, 90, 0.2)",
        // Quầng sáng phụ: xanh non.
        "glow-green": "0 0 0 1px var(--color-green), 0 8px 24px -8px rgba(167, 215, 122, 0.14)",
        "glow-yellow": "0 0 0 1px var(--color-yellow), 0 8px 24px -8px rgba(124, 195, 90, 0.2)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
