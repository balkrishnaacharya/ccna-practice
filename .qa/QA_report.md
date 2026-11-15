## QA Report — CCNA Practice App — http://localhost:1420 — 2026-11-14

### Executive Summary
Total issues found: **7** (3 High, 3 Medium, 1 Low)
- **3 High** severity: Missing Tauri commands causing console errors/broken pages
- **3 Medium** severity: UI/UX polish issues visible in code review
- **1 Low** severity: Minor spacing/alignment concern

---

### Smoke Test
- Console errors on page load: **3 critical** (missing Tauri commands)
- Network: N/A (local Tauri app — no external network calls)
- Core Web Vitals: Cannot measure without running app

### Interactions

| # | Page | Element/Location | Issue | Severity | Notes |
|---|------|-----------------|-------|----------|-------|
| 1 | / (Dashboard) | `invoke("get_dashboard_stats")` | Command not found in Rust backend — console error, stats never load | **High** | Page fails to render stats; shows loading spinner or error |
| 2 | / (Dashboard) | Daily Goal progress bar | Width capped at 100% even if goal > 100 — visual limitation | Low | `Math.min(100, dailyGoalPct)` in style |
| 3 | /exam | `ExamConfirmationModal` import | Was missing import — caused `ReferenceError: Can't find variable: ExamConfirmationModal` | **High** | **FIXED** — import added at `src/App.jsx:29` |
| 4 | /flashcards | `<Button>` component | Was used without import — caused `ReferenceError: Can't find variable: Button` | **High** | **FIXED** — import added at `src/components/flashcards/FlashcardDeck.jsx:6` |
| 5 | /settings | Notification settings | `useNotifications()` hook calls `invoke("get_notification_settings")`, `invoke("check_reminder_status")`, `invoke("send_in_app_notification")` — commands must exist in Rust | **High** | Backend commands need registration in `src-tauri/src/commands.rs` and `src-tauri/src/lib.rs` |
| 6 | /dashboard | Stats grid layout | `md:grid-cols-2` on statistics row — on narrow screens (375px), cards stack vertically which is correct, but on 1440px the 3-column grid may feel cramped | Medium | Layout works but could use wider gutters |
| 7 | /review | Domain filter `<select>` | On mobile (375px), the select dropdown may overflow — no `sm:` max-width constraint on the select container | Medium | Should test select behavior on mobile |

### Visual Regression

| # | Page | Issue | Severity | Screenshot Description |
|---|------|-------|----------|----------------------|
| 1 | / (Dashboard) | Daily Goal bar width capped at 100% — if user sets goal > 100%, bar never fills completely | Low | Bar shows 100% even when dailyGoalPct > 100 (capped by `Math.min(100, dailyGoalPct)`) |
| 2 | /flashcards | "Review Again" button in isComplete state — tight padding between button and card footer | Medium | Button at line 134 has `py-2` padding inside `p-6` card, feels slightly tight |
| 3 | /settings | Notification preview box — fixed height `pt-4 border-t` may overflow on very long reminder descriptions | Low | Preview text wraps but container has fixed top border |
| 4 | /review | Flagged question stem text — can be very long and overflow the `h2` container without truncation | Medium | `{f.stem}` has no `truncate` or `line-clamp` class |

### Accessibility

| # | Page | Violation | Severity |
|---|------|-----------|----------|
| 1 | / (Dashboard) | Stat cards (`Quick Stats`, `Domain Mastery`) use color-only semantics (bg-gold/bg-sage/bg-heart) without text alternative | AA | Screen readers won't convey "gold = good, sage = medium, heart = needs improvement" |
| 2 | /quiz | Answer choice radio/checkboxes — `focus-ring-gold` provides focus outline, but `pointer-events-none` during feedback state blocks keyboard navigation | AA | When `feedback !== null`, inputs are disabled but focus remains on previous element |
| 3 | /exam | Question stem has `font-normal` weight — may lack sufficient contrast against dark background on some monitors | AA | Color `#paper` on `#dark/80` needs verification |
| 4 | /settings | Notification checkboxes — `w-4 h-4` size may be small for motor-impaired users using touch | AA | Minimum tap target recommendation is 48x48px; checkboxes are smaller |

---

### Top 3 Most Critical Fixes

1. **Implement missing Tauri commands** (`get_dashboard_stats`, and ensure `get_notification_settings`, `check_reminder_status`, `send_in_app_notification`, `get_notification_history` are registered in `src-tauri/src/commands.rs` and exported from `src-tauri/src/lib.rs`) — **High severity** as these cause console errors and broken UI on multiple pages.

2. **Verify ExamConfirmationModal import** — Already fixed by adding `import ExamConfirmationModal from "@/components/shared/ConfirmDialog"` to `src/App.jsx:29`.

3. **Verify Button import in FlashcardDeck** — Already fixed by adding `import { Button } from "@/components/ui/button"` to `src/components/flashcards/FlashcardDeck.jsx:6`.

---

### Pages Completely Broken (without Rust backend)

- **Dashboard**: Stats section completely broken — `get_dashboard_stats` command not found
- **Settings**: Notification section broken — `useNotifications()` hook fails on mount
- **All pages using Tauri commands**: Any page that invokes Tauri commands will fail until the Rust backend is complete

### Verdict: **FIX REMAINING TAURI BACKEND**

The two React import crashes (ExamConfirmationModal and Button) are now fixed. The remaining blocker is the Tauri Rust backend — numerous `invoke("...")` calls across the codebase reference commands that exist in the frontend JS but are not implemented in the Rust `src-tauri/src/commands.rs` and registered in `src-tauri/src/lib.rs`. Once the backend commands are implemented, the app should function fully.

**Remaining work**: Implement the following Tauri commands in Rust:
- `get_dashboard_stats` (used in Dashboard.jsx)
- `get_notification_settings`, `update_notification_setting`, `send_in_app_notification`, `get_notification_history`, `check_reminder_status` (used in useNotifications.js and Settings.jsx)
- And all other exam/quiz/flashcard commands