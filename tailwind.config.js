/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0E1118",
          panel: "#171D25",
          surface: "#21211D",
          card: "#262622",
          elevated: "#2E2E28",
          border: "rgba(246, 242, 233, 0.10)",
          borderSubtle: "rgba(246, 242, 233, 0.06)",
        },
        paper: {
          DEFAULT: "#F6F2E9",
          muted: "rgba(246, 242, 233, 0.70)",
          dim: "rgba(246, 242, 233, 0.60)",
          faint: "rgba(246, 242, 233, 0.20)",
        },
        ink: "#E8EEF5",
        muted: "#7C8A97",
        text: {
          ink: "#E8EEF5",
          muted: "#7C8A97",
        },
        gold: {
          DEFAULT: "#BD8D39",
          hover: "#C99A47",
          light: "#D8A243",
          glow: "rgba(189, 141, 57, 0.35)",
        },
        sage: {
          DEFAULT: "#5C6E4E",
          hover: "#6C805C",
          light: "#93AB80",
          glow: "rgba(92, 110, 78, 0.35)",
        },
        heart: {
          DEFAULT: "#C36842",
          hover: "#D1724B",
          light: "#E1825B",
          glow: "rgba(195, 104, 66, 0.35)",
        },
        peach: {
          DEFAULT: "#E8A87C",
          light: "#F0B891",
          muted: "rgba(232, 168, 124, 0.20)",
        },
        accent: {
          DEFAULT: "#BD8D39",
          gold: "#C9A227",
        },
      },
    },
    safelist: [
      {
        pattern: /bg-dark-bg/,
      },
      {
        pattern: /text-ink/,
      },
    ],
  },
  plugins: [],
};