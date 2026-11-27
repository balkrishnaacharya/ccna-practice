// CCNA Practice — canonical design tokens.
//
// This is the single source of truth for the palette. tailwind.config.js imports
// PALETTE directly; styles.css mirrors the same values in CSS custom properties
// for the few rules Tailwind cannot express. Do not hardcode hex values in
// components — use the Tailwind utilities generated from these tokens.

export const PALETTE = {
  // Chassis
  chassis: "#0E1118",
  panel: "#171D25",
  surface: "#21211D",
  card: "#262622",
  elevated: "#2E2E28",
  border: "rgba(246, 242, 233, 0.10)",
  borderSubtle: "rgba(246, 242, 233, 0.06)",

  // Text
  ink: "#E8EEF5",
  muted: "#7C8A97",
  paper: "#F6F2E9",
  paperMuted: "rgba(246, 242, 233, 0.70)",
  paperDim: "rgba(246, 242, 233, 0.60)",
  paperFaint: "rgba(246, 242, 233, 0.20)",

  // Gold — surgical accent
  gold: "#BD8D39",
  goldHover: "#C99A47",
  goldLight: "#D8A243",
  goldGlow: "rgba(189, 141, 57, 0.35)",
  accentGold: "#C9A227",

  // Sage — correct / success
  sage: "#5C6E4E",
  sageHover: "#6C805C",
  sageLight: "#93AB80",
  sageGlow: "rgba(92, 110, 78, 0.35)",

  // Heart — incorrect / danger
  heart: "#C36842",
  heartHover: "#D1724B",
  heartLight: "#E1825B",
  heartGlow: "rgba(195, 104, 66, 0.35)",

  // Peach — secondary signal
  peach: "#E8A87C",
  peachLight: "#F0B891",
  peachMuted: "rgba(232, 168, 124, 0.20)",
};

// Back-compatible aliases retained for any code importing the old names.
export const COLORS = PALETTE;

export const TYPOGRAPHY = {
  pageTitle: "text-2xl font-serif font-normal text-paper",
  sectionHeading: "text-lg font-semibold text-paper",
  cardHeading: "text-base font-semibold text-paper",
  body: "text-sm text-paper",
  description: "text-xs text-paper-muted",
  label: "text-xs font-medium text-paper-dim",
  metadata: "text-xs text-paper-dim",
  statistic: "text-2xl font-serif font-normal text-paper",
};

export const SPACING = {
  pagePadding: "p-6 sm:p-7",
  sectionGap: "space-y-6",
  cardPadding: "p-6 sm:p-7",
  componentGap: "gap-4",
  formGap: "gap-3",
  navGap: "gap-2",
};

export const RADIUS = {
  full: "rounded-full",
  large: "rounded-2xl",
  medium: "rounded-xl",
  small: "rounded-lg",
};
