/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "var(--ccna-border)",
        paper: "#F6F2E9",
        "paper-muted": "#A09A8A",
      },
    },
  },
  safelist: [
    {
      pattern: /text-paper/,
    },
    {
      pattern: /text-paper-muted/,
    },
    {
      pattern: /border-border/,
    },
  ],
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".text-paper": {
          color: "var(--ccna-paper, #F6F2E9)",
        },
        ".text-paper-muted": {
          color: "var(--ccna-paper-muted, #A09A8A)",
        },
      }, ["responsive", "hover", "focus"]);
    },
  ],
}