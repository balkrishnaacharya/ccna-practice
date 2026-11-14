---
status: resolved
trigger: "@systematic-debugging @debugger @using-superpowers @context-compressor @test-driven-development @browser Source map error..."
created: 2026-11-14
updated: 2026-11-14
---

## Current Focus
resolved

## Symptoms
expected: App starts and runs without errors
actual: Two runtime errors:
1. `ReferenceError: cn is not defined` at App.jsx:291 during commitLayoutMountEffects
2. `Something went wrong` via ErrorBoundary on Dashboard route (caused by missing `domainLabels`)

errors:
- "Uncaught ReferenceError: cn is not defined children App.jsx:291 App App.jsx:285"
- "Something went wrong — The app encountered an unexpected error."

## Eliminated
- hypothesis: Build/syntax errors in JSX files
  evidence: `vite build` passes with zero errors after fixing JSX syntax issues
- hypothesis: `tauri-plugin-app` Rust crate needed for `getVersion()`
  evidence: `tauri-plugin-app` only has alpha versions for Tauri 2.0, not stable 2.0
- hypothesis: Rust plugin registration needed for `getVersion()`
  evidence: Reverted; JS-side try-catch is sufficient

## Evidence
- checked: `src/App.jsx` line 30
  found: `import { cn, NAV_ITEMS } from "@/components/layout/Sidebar"` — but `cn` is NOT exported from Sidebar.jsx; it's defined in `src/lib/utils.js`
  implication: `cn` was `undefined` at runtime → ReferenceError when called at line 291
- checked: `src/pages/Dashboard.jsx` lines 192, 267
  found: `domainLabels` referenced but its definition was accidentally removed during earlier refactoring
  implication: `domainLabels` was `undefined` → ReferenceError when stats load → ErrorBoundary catches it
- checked: `src-tauri/capabilities/default.json`
  found: Missing `core:app:default` permission
  implication: Added for completeness even though JS-side try-catch handles the missing plugin gracefully
- checked: `src/utils/useUpdater.js` line 19-21
  found: `getVersion().then(setCurrentVersion).catch(...)` doesn't catch synchronous throws
  implication: Wrapped in try-catch with cancellation guard

## Resolution
root_cause:
  1. `cn` imported from wrong module in App.jsx (Sidebar.jsx doesn't export `cn`; it comes from `@/lib/utils`)
  2. `domainLabels` definition accidentally deleted from Dashboard.jsx during refactoring
fix:
  1. `src/App.jsx`: Split import — `cn` from `@/lib/utils`, `NAV_ITEMS` from `@/components/layout/Sidebar`
  2. `src/pages/Dashboard.jsx`: Re-added `domainLabels` constant with domain name mappings
  3. `src/utils/useUpdater.js`: Wrapped `getVersion()` in try-catch with cancellation guard
  4. `src-tauri/capabilities/default.json`: Added `core:app:default` permission
verification: `npm run tauri dev` starts successfully with no terminal errors; `vite build` passes cleanly; no ErrorBoundary shown on app load