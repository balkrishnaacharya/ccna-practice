/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#181815",
          surface: "#21211D",
          card: "#262622",
          elevated: "#2E2E28",
          border: "rgba(246, 242, 233, 0.10)",
          borderSubtle: "rgba(246, 242, 233, 0.06)",
        },
        paper: {
          DEFAULT: "#F6F2E9",
          muted: "rgba(246, 242, 233, 0.70)",
          dim: "rgba(246, 242, 233, 0.45)",
          faint: "rgba(246, 242, 233, 0.20)",
        },
        gold: {
          DEFAULT: "#B8842A",
          hover: "#C99232",
          light: "#D8A243",
          glow: "rgba(184, 132, 42, 0.35)",
        },
        sage: {
          DEFAULT: "#5C6E4E",
          hover: "#6C805C",
          light: "#7D946B",
          glow: "rgba(92, 110, 78, 0.35)",
        },
        heart: {
          DEFAULT: "#C1633C",
          hover: "#D1724B",
          light: "#E1825B",
          glow: "rgba(193, 99, 60, 0.35)",
        },
        peach: {
          DEFAULT: "#E8A87C",
          light: "#F0B891",
          muted: "rgba(232, 168, 124, 0.20)",
        },
        accent: "#B8842A",
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['Graphik', '"Plus Jakarta Sans"', 'Satoshi', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -4px rgba(184, 132, 42, 0.45)',
        'gold-glow-lg': '0 0 35px -2px rgba(184, 132, 42, 0.60)',
        'sage-glow': '0 0 25px -4px rgba(92, 110, 78, 0.45)',
        'heart-glow': '0 0 25px -4px rgba(193, 99, 60, 0.45)',
        'dock': '0 20px 45px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(246, 242, 233, 0.1)',
      },
    },
  },
  plugins: [],
};
