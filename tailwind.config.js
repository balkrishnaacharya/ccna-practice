import { PALETTE as p } from "./src/lib/design-tokens.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // shadcn/Radix primitives use these CSS-variable-backed tokens. Without
        // the mappings their utility classes (bg-popover, text-muted-foreground,
        // ring-ring, ...) are silently dropped by Tailwind at build time.
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        dark: {
          bg: p.chassis,
          panel: p.panel,
          surface: p.surface,
          card: p.card,
          elevated: p.elevated,
          border: p.border,
          borderSubtle: p.borderSubtle,
        },
        paper: {
          DEFAULT: p.paper,
          muted: p.paperMuted,
          dim: p.paperDim,
          faint: p.paperFaint,
        },
        ink: p.ink,
        muted: {
          DEFAULT: p.muted,
          foreground: "hsl(var(--muted-foreground))",
        },
        text: {
          ink: p.ink,
          muted: p.muted,
        },
        gold: {
          DEFAULT: p.gold,
          hover: p.goldHover,
          light: p.goldLight,
          glow: p.goldGlow,
        },
        sage: {
          DEFAULT: p.sage,
          hover: p.sageHover,
          light: p.sageLight,
          glow: p.sageGlow,
        },
        heart: {
          DEFAULT: p.heart,
          hover: p.heartHover,
          light: p.heartLight,
          glow: p.heartGlow,
        },
        peach: {
          DEFAULT: p.peach,
          light: p.peachLight,
          muted: p.peachMuted,
        },
        accent: {
          DEFAULT: p.gold,
          gold: p.accentGold,
          foreground: "hsl(var(--accent-foreground))",
        },
        border: "var(--ccna-border)",
      },
      fontFamily: {
        serif: ['Georgia', '"Iowan Old Style"', '"Palatino Linotype"', '"Book Antiqua"', '"Times New Roman"', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -4px rgba(189, 141, 57, 0.45)',
        'gold-glow-lg': '0 0 35px -2px rgba(189, 141, 57, 0.60)',
        'sage-glow': '0 0 25px -4px rgba(92, 110, 78, 0.45)',
        'heart-glow': '0 0 25px -4px rgba(195, 104, 66, 0.45)',
        'dock': '0 20px 45px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(246, 242, 233, 0.1)',
      },
      animation: {
        'shine': 'shine var(--duration) infinite linear',
      },
    },
  },
  safelist: [
    { pattern: /bg-dark-bg/ },
    { pattern: /text-ink/ },
    { pattern: /text-paper/ },
    { pattern: /text-paper-muted/ },
    { pattern: /border-border/ },
  ],
  plugins: [],
};
