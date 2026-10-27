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
          dim: "rgba(246, 242, 233, 0.60)",
          faint: "rgba(246, 242, 233, 0.20)",
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
        accent: "#BD8D39",
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
    },
  },
  plugins: [],
};
