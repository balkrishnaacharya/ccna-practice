# Visual Audit — CCNA Practice 2.0

Scores across 10 dimensions (0–10 each), with specific examples and `file:line` fixes.

## Summary Scorecard

| # | Dimension | Score | Verdict |
|---|-----------|-------|---------|
| 1 | Color consistency | 8 | Palette-driven, few strays |
| 2 | Typography hierarchy | 7 | Serif/sans split is clear; sizes inconsistent in places |
| 3 | Spacing rhythm | 8 | Tailwind 4px grid used; minor drift |
| 4 | Component consistency | 6 | Cards repeat but buttons diverge |
| 5 | Responsive behavior | 7 | Grid columns responsive; nav hides/shows abruptly |
| 6 | Dark mode | 9 | Complete dark theme; no light-mode leaks |
| 7 | Animation | 7 | Purposeful + reduced-motion respected; some gratuitous |
| 8 | Accessibility | 6 | Contrast OK on primary text; focus states missing |
| 9 | Information density | 7 | Clean but dashboard is busy |
| 10 | Polish | 8 | Hover/active/loading states present; empty states sparse |

**Overall: 7.3 / 10** — Solid, cohesive design system with a few consistency gaps.

---

## 1. Color consistency — 8/10

**Finding:** Nearly all color values flow through the `tailwind.config.js` token map (`dark`, `paper`, `gold`, `sage`, `heart`, `peach`). No random hex values spotted in component JSX.

**Minor drift:** Inline `bg-gradient-to-br from-[#8E6319] via-gold to-[#D8A243]` on the floating Exam button (`src/components/FloatingBottomNav.jsx:205`) uses `#8E6319`, a gold shade not defined in the token map.

**Fix:** Add `gold.deep: "#8E6319"` to `tailwind.config.js:6-45` and replace the inline value with `from-gold-deep`.

**Evidence:**
- `tailwind.config.js:6-45` — canonical color map
- `src/components/FloatingBottomNav.jsx:205` — inline `#8E6319`

---

## 2. Typography hierarchy — 7/10

**Finding:** Clear serif-for-headings / sans-for-body split. `font-serif` on page titles (`font-serif text-3xl sm:text-4xl`), `font-sans` on UI copy, `font-mono` on data.

**Gaps:**
- Heading sizes are not on a consistent scale: `text-xl` (`src/pages/Dashboard.jsx:205`), `text-lg` (`src/pages/Dashboard.jsx:252`), `text-2xl` (`src/components/ExamConfirmationModal.jsx:60`), `text-3xl` (`src/pages/Dashboard.jsx:114`, `src/pages/Settings.jsx:80`) appear with no defined step.
- Body copy drifts between `text-sm`, `text-xs`, `text-[11px]` without a defined caption scale.

**Fix:** Define a type scale (h1 `text-4xl`, h2 `text-2xl`, h3 `text-xl`, body `text-sm`, caption `text-xs`) and apply uniformly; replace ad-hoc `text-[11px]` with the caption token.

**Evidence:**
- `src/pages/Dashboard.jsx:114` — `text-3xl sm:text-4xl` (h1)
- `src/pages/Dashboard.jsx:205` — `text-xl` (h2)
- `src/pages/Dashboard.jsx:252` — `text-lg` (h3)
- `src/components/ExamConfirmationModal.jsx:60` — `text-2xl` (h2)
- `src/components/FloatingBottomNav.jsx:191` — `text-[11px]`

---

## 3. Spacing rhythm — 8/10

**Finding:** Tailwind 4px grid used consistently: `px-4`/`sm:px-6` page padding, `p-6`/`p-5` card padding, `gap-4`/`gap-6` grid gaps, `space-y-3/4/5` internal rhythm.

**Minor drift:** Hero banner uses `p-6 sm:p-8` (`src/pages/Dashboard.jsx:104`) while stat cards use `p-5` (`src/pages/Dashboard.jsx:419`) — close but not identical.

**Fix:** Standardize card padding to `p-6` across all panels; keep `p-5` only for compact quick-launch cards if intentional.

**Evidence:**
- `src/pages/Dashboard.jsx:104` — `p-6 sm:p-8`
- `src/pages/Dashboard.jsx:419` — `p-5` (StatCard)
- `src/pages/Settings.jsx:87` — `p-6` (profile card)

---

## 4. Component consistency — 6/10

**Finding:** Card shape (`border border-dark-border rounded-2xl bg-dark-card shadow-dock`) is repeated across Dashboard quick-launch cards and Settings sections — good.

**Gaps:** Buttons diverge significantly:
- Primary CTA: `bg-gold hover:bg-gold-hover text-dark-bg ... shadow-gold-glow` (`src/pages/Dashboard.jsx:135`)
- Secondary link: `bg-dark-surface hover:bg-dark-elevated text-paper ... border border-dark-border` (`src/pages/Dashboard.jsx:141`)
- Exam floating button: `bg-gradient-to-tr from-[#8E6319] via-gold to-[#D8A243] ... shadow-gold-glow` (`src/components/FloatingBottomNav.jsx:205`) — gradient + inline hex, breaks the flat button pattern.
- Modal confirm: `bg-gold hover:bg-gold-hover text-dark-bg ... shadow-gold-glow` (`src/components/ExamConfirmationModal.jsx:95`) — matches primary CTA, good.
- Reset button: `bg-heart hover:bg-heart-hover text-dark-bg ... shadow-heart-glow` (`src/components/ExamConfirmationModal.jsx` / `src/pages/Settings.jsx:335`) — semantic variant, good.

**Fix:** Consolidate all primary actions into one `.btn-primary` class (gold flat + glow), all secondary into `.btn-secondary` (surface + border), and remove the gradient on the floating Exam button. Define button variants in a shared CSS block or Tailwind component.

**Evidence:**
- `src/pages/Dashboard.jsx:135` — primary CTA
- `src/pages/Dashboard.jsx:141` — secondary link
- `src/components/FloatingBottomNav.jsx:205` — gradient Exam button (outlier)
- `src/pages/Settings.jsx:335` — heart danger button

---

## 5. Responsive behavior — 7/10

**Finding:** Grid columns respond well: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` for stats (`src/pages/Dashboard.jsx:162`), `flex-col lg:flex-row` for hero (`src/pages/Dashboard.jsx:108`), `hidden md:flex`/`hidden sm:block` for nav links (`src/App.jsx:149,174`).

**Gaps:** Bottom nav pill uses fixed `min-w-[50px]` touch targets (`src/components/FloatingBottomNav.jsx:182`) which can crowd on small phones (`< 375px`); the desktop nav `hidden md:flex` appears/disappears at 768px with no intermediate state.

**Fix:** Add `xs` breakpoint handling for the bottom nav (reduce padding to `px-2`, shrink icons to `min-w-[44px]`); consider a `sm` nav variant so links don't vanish entirely between mobile and 768px.

**Evidence:**
- `src/components/FloatingBottomNav.jsx:182` — `min-w-[50px]`
- `src/App.jsx:149` — `hidden md:flex` desktop links
- `src/App.jsx:174` — `hidden sm:block` settings link

---

## 6. Dark mode — 9/10

**Finding:** Complete dark theme. `color-scheme: dark` set in `:root` (`src/styles.css:8`), body bg `#181815`, all surfaces dark, no white/light-mode leaks. Paper text `#F6F2E9` gives ≈15:1 contrast on dark bg — excellent readability.

**Minor:** The `animate-spin` loader border uses `border-gold` (`src/pages/Dashboard.jsx:76`) — fine on dark.

**Evidence:**
- `src/styles.css:7-11` — `:root` color-scheme + CSS vars
- `src/styles.css:21-27` — body bg + text

---

## 7. Animation — 7/10

**Finding:** Animation is purposeful: mesh blobs (ambient, pause on background/visibility), GSAP splash (first-launch only, skip on reduced-motion), pill follow (transform-only), ScrollTrigger entrance on domain cards.

**Respects `prefers-reduced-motion`:** mesh blobs disabled (`src/styles.css:89-95`), splash skipped (`src/components/SplashSequence.jsx:28-33`).

**Gratuitous:** The Dashboard parallax scroll on every domain-row card (`src/pages/Dashboard.jsx:49-68`) fires `play none none none` on scroll — eye-catching but adds no information. The `animate-pulse` on the gold dot (`src/pages/Dashboard.jsx:111`) is constant motion on a static dashboard.

**Fix:** Gate the parallax ScrollTrigger behind a reduced-motion check; make the pulse dot pulse only on hover, not continuously.

**Evidence:**
- `src/styles.css:38-95` — mesh blobs + reduced-motion
- `src/components/SplashSequence.jsx:28-33` — reduced-motion guard
- `src/pages/Dashboard.jsx:49-68` — ScrollTrigger parallax
- `src/pages/Dashboard.jsx:111` — `animate-pulse` constant

---

## 8. Accessibility — 6/10

**Finding:** Primary text contrast is excellent (paper on dark ≈15:1). Gold CTAs (`#BD8D39` on `#181815`) ≈ 4.6:1 — passes AA for large text, borderline for small text (the `text-xs` buttons).

**Gaps:**
- No visible `:focus-visible` ring on interactive elements (inputs use `focus:ring-1 focus:ring-gold` in Settings (`src/pages/Settings.jsx:106,149`) but buttons lack focus rings).
- Touch targets: bottom nav icons `min-w-[50px]` (`src/components/FloatingBottomNav.jsx:182`) — just under the 44px × 44px WCAG recommendation at default font size; the floating Exam button is `w-12 h-12` (48px) — passes.
- Color is the only indicator for accuracy state in weak-area bars (sage/gold/heart) — no pattern or icon fallback.
- `aria-label` present on bottom nav (`src/components/FloatingBottomNav.jsx:161`) and Exam button (`src/components/FloatingBottomNav.jsx:207`) — good.

**Fix:** Add `focus-visible:ring-2 focus-visible:ring-gold/50` to all buttons; raise small button text to at least `text-sm` for contrast; add an icon or pattern to accuracy bars; ensure all touch targets ≥ 44px.

**Evidence:**
- `src/pages/Settings.jsx:106` — input focus ring (partial pattern)
- `src/components/FloatingBottomNav.jsx:182` — `min-w-[50px]` touch target
- `src/pages/Dashboard.jsx:284-292` — color-only accuracy bars

---

## 9. Information density — 7/10

**Finding:** Dashboard is intentionally information-dense (KPI cards + domain distribution + weak areas + flags + spaced review + notes + standards). Cards are well-separated (`shadow-dock`, borders) so it reads as grouped chunks rather than a wall.

**Gaps:** The hero greeting + 4 action buttons + KPI row + 6 quick-launch cards on one screen is a lot for first-time users. The splash sequence already onboards; the dashboard could defer secondary panels (spaced review, standards) behind a "More" toggle on mobile.

**Fix:** On `< lg`, collapse the bottom 3 quick-launch cards (notes, standards, spaced review) into an accordion or secondary tab to reduce initial cognitive load.

**Evidence:**
- `src/pages/Dashboard.jsx:99-408` — full dashboard layout

---

## 10. Polish — 8/10

**Finding:** Hover states (`hover:bg-gold-hover`, `hover:text-paper`, `hover:scale-105`), active states (`active:scale-95`), loading states (`animate-spin` loader, `Checking…`/`Downloading…` button text), empty states ("Answer a few questions…" in Weak Areas) all present. Modal overlays use `backdrop-blur-md`. Exit-confirm modal guards unsaved exam progress.

**Gaps:** No dedicated empty-state illustration for "no history" or "no flagged questions" — just text. No skeleton loaders for stat cards while data fetches (shows spinner + "Loading candidate analytics…").

**Fix:** Add a minimal skeleton state for the KPI grid during initial fetch; add a small empty-state illustration (SVG) for history/flagged-empty views.

**Evidence:**
- `src/pages/Dashboard.jsx:73-81` — loading spinner
- `src/pages/Dashboard.jsx:259-262` — weak-areas empty text
- `src/App.jsx:241-274` — leave-exam guard modal

---

## Recommended fix order (impact/effort)

1. **Add `gold.deep` token + remove inline `#8E6319`** — `tailwind.config.js`, `FloatingBottomNav.jsx:205` (15 min)
2. **Define type scale + replace ad-hoc sizes** — `tailwind.config.js`, `Dashboard.jsx`, `ExamConfirmationModal.jsx`, `FloatingBottomNav.jsx` (30 min)
3. **Add `:focus-visible` rings + ≥44px touch targets** — `Settings.jsx`, `FloatingBottomNav.jsx`, `Dashboard.jsx` (30 min)
4. **Consolidate button variants** — shared CSS/Tailwind component (45 min)
5. **Gate parallax + constant pulse behind reduced-motion** — `Dashboard.jsx:49-68,111` (20 min)
