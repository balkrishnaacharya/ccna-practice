// CCNA Practice — centralized design tokens
// Single source of truth for colors, typography, and spacing.
// Use these values consistently across all components.

export const COLORS = {
  // Backgrounds
  background: "#181815",
  card: "#2A2A27",
  elevated: "#3A3A36",

  // Primary accent (gold)
  primary: "#B8842A",
  primaryHover: "#C99A47",
  primaryLight: "#B8842A/10",
  primaryBorder: "#B8842A/30",

  // Text
  text: "#F6F2E9",
  textMuted: "#A09A8A",
  textDim: "#6B6B64",

  // Borders
  border: "#3A3A36",

  // Semantic
  success: "#8FAE62",
  warning: "#D9A441",
  error: "#C1633C",
  disabled: "#4A443A",
};

export const TYPOGRAPHY = {
  // Page titles
  pageTitle: "text-2xl font-serif font-normal text-paper",
  // Section headings
  sectionHeading: "text-lg font-semibold text-paper",
  // Card headings
  cardHeading: "text-base font-semibold text-paper",
  // Body text
  body: "text-sm text-paper",
  // Supporting descriptions
  description: "text-xs text-paper-muted",
  // Labels
  label: "text-xs font-medium text-paper-dim",
  // Small metadata
  metadata: "text-xs text-paper-dim",
  // Numeric statistics
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
