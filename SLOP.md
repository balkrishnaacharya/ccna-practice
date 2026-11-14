# AI Slop Detection — CCNA Practice 2.0

Scanning for generic AI-generated design patterns: gratuitous gradients, purple-to-blue defaults, glass-morphism cards with no purpose, rounded corners on things that shouldn't be rounded, excessive scroll animation, generic hero with centered text over stock gradient, soulless sans-serif stacks.

## Verdict: CLEAN — No AI slop detected

The UI is deliberately styled, not generated. No purple-to-blue gradients, no glass-morphism cards, no gratuitous scroll-reveal on every element, no centered hero over a stock gradient. The serif heading stack gives it personality.

---

## Pattern-by-pattern check

### 1. Gratuitous gradients on everything — NOT FOUND
Gradients are used sparingly and intentionally:
- Organic mesh background blobs (`src/components/OrganicMeshBackground.jsx:19-24`) — ambient atmospheric layer, decorative, justified.
- Floating Exam button (`src/components/FloatingBottomNav.jsx:205`) — `bg-gradient-to-tr from-[#8E6319] via-gold to-[#D8A243]` — a brand gold gradient on the primary CTA, not everywhere.
- Dashboard domain progress bars (`src/pages/Dashboard.jsx:235`) — `bg-gradient-to-r from-gold to-[#D8A243]` — data visualization, justified.

No "gradient on every card/button/background" pattern.

### 2. Purple-to-blue defaults — NOT FOUND
No indigo/purple/blue default palette anywhere. The accent is Agent Gold `#BD8D39`, with sage/heart/peach semantic accents. No `bg-indigo-500`, `text-blue-600`, or similar defaults.

### 3. Glass morphism cards with no purpose — NOT FOUND
No `backdrop-blur` on cards (it's used only on the top nav bar `src/App.jsx:127` and modal overlays `src/App.jsx:242`, which is a legitimate overlay treatment). Cards are opaque dark surfaces (`bg-dark-card`) with borders and dock shadows — solid, not frosted glass.

### 4. Rounded corners on things that shouldn't be rounded — PARTIAL
`rounded-full` (pill) is applied heavily and consistently:
- Nav pills (`src/App.jsx:157`), stat badges, chips, buttons — consistent pill morphology, intentional design language.
- `rounded-2xl` on cards — standard.
- `rounded-full` on the floating Exam button and bottom nav items — consistent with the pill theme.

This is a deliberate motif, not thoughtless rounding. Everything that's interactive is a pill; cards use `rounded-2xl`. No egregious cases (e.g., rounded tables or code blocks).

### 5. Excessive animations on scroll — PARTIAL
Dashboard uses GSAP ScrollTrigger on every `.domain-row` card (`src/pages/Dashboard.jsx:49-68`) — a "reveal on scroll" pattern that borders on gratuitous since it adds no information. However:
- It respects `prefers-reduced-motion` (GSAP `matchMedia` guard in `SplashSequence.jsx:28-33`, mesh pause in `styles.css:89-95`).
- Animations are transform-only (`opacity`, `y`) — compositor-friendly, not layout-thrashing.

**Flagged:** The per-card scroll reveal (`Dashboard.jsx:49-68`) is the one AI-slop-adjacent pattern. It's mild and accessible, but unnecessary.

### 6. Generic hero with centered text over stock gradient — NOT FOUND
Dashboard hero (`src/pages/Dashboard.jsx:101-159`) is left-aligned editorial text with a serif heading, gold accent chip, and CTAs — not a centered hero over a stock gradient. The splash sequence (`src/components/SplashSequence.jsx`) is a branded logo reveal, not a generic hero.

### 7. Sans-serif font stack with no personality — NOT FOUND
Headings use a serif stack (Georgia / Iowan Old Style / Palatino / Book Antiqua / Times New Roman) giving the app editorial personality. Body uses Inter/sans. Not a generic "Inter everywhere" stack.

---

## Bonus observations (not slop, but worth noting)

| Observation | Location | Assessment |
|-------------|----------|------------|
| Constant `animate-pulse` on gold dot | `Dashboard.jsx:111` | Continuous motion on static dashboard; gate to hover |
| Per-card scroll reveal | `Dashboard.jsx:49-68` | Gratuitous reveal; respect reduced-motion |
| Inline `#8E6319` gradient on Exam button | `FloatingBottomNav.jsx:205` | Non-token color; add `gold.deep` |

None of these rise to AI slop — they're minor polish items covered in `AUDIT.md`.

---

## Files with zero slop patterns
`App.jsx`, `settings`, `Exam`, `Quiz`, `Review`, `ExamHistory`, `SessionReview`, `Notes`, `Topics`, `PracticalExam`, `StreakPanel`, `RouteLoader`, `ErrorBoundary`, `UpdateModal`, `DirectionalRouteWrapper`, `CliTerminal` — no gratuitous gradients, glass morphism, or generic heroes found.

**Bottom line:** Ship as-is. The design is hand-crafted and cohesive.
