---
phase: 4
plan: 4.1
wave: 1
depends_on: []
files_modified:
  - package.json
  - components.json
  - src/components/ui/smooth-cursor.jsx
  - src/components/SmoothCursorWrapper.jsx
  - src/App.jsx
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Smooth cursor renders on desktop/PC only, not on Android"
    - "App builds successfully with new dependencies"
    - "Cursor does not interfere with clickable elements (buttons, links, inputs)"
  artifacts:
    - "components.json — shadcn/ui config initialized"
    - "src/components/ui/smooth-cursor.jsx — magicui smooth-cursor component"
    - "src/components/SmoothCursorWrapper.jsx — desktop-only gate"
    - "src/App.jsx — wrapper mounted in layout"
  key_links:
    - "useUpdater.js:14 — existing isAndroid detection pattern to reuse"
    - "App.jsx:118 — root layout div where wrapper should be mounted"
---

# Plan 4.1: Add Smooth Cursor (PC/Desktop Only)

## Objective

Initialize shadcn/ui, add the `@magicui/smooth-cursor` component, and integrate it into the app so it renders only on desktop/PC (not Android). The cursor should not interfere with clickable elements.

Purpose: Add a polished cursor trail effect for desktop users while keeping mobile/Android unaffected.
Output: shadcn/ui initialized, smooth-cursor component added, desktop-only wrapper mounted in App.jsx.

## Context

Load these files for context:
- package.json — existing dependencies (React 18, Vite, Tailwind, no shadcn/radix)
- src/App.jsx — root layout (line 118: root div)
- src/utils/useUpdater.js:14 — existing isAndroid detection pattern to reuse
- src/components/ — existing component patterns (all .jsx, functional components)

## Tasks

<task type="auto">
  <name>Initialize shadcn/ui and add smooth-cursor component</name>
  <files>
    package.json
    components.json
    src/components/ui/smooth-cursor.jsx
  </files>
  <action>
    1. Run `npx shadcn@latest init` to initialize shadcn/ui (accept defaults: Tailwind, alias @/src, no TypeScript since project uses JS).
    2. Run `npx shadcn@latest add @magicui/smooth-cursor` to add the component.
    3. The component will be created at src/components/ui/smooth-cursor.jsx (or .tsx). Since project is JS, ensure it's .jsx.
    4. Verify the component exports a SmoothCursor React component.

    AVOID: Do not modify existing component library files beyond what shadcn adds. Do not add TypeScript config. Do not change Tailwind config beyond shadcn's init.
    USE: `npx shadcn@latest` commands as the canonical installation path.

  </action>
  <verify>
    `ls src/components/ui/smooth-cursor.jsx` exists. `npx shadcn@latest init` and `add` complete without errors.
  </verify>
  <done>
    shadcn/ui initialized, smooth-cursor component file exists.
  </done>
</task>

<task type="auto">
  <name>Create desktop-only SmoothCursor wrapper</name>
  <files>
    src/components/SmoothCursorWrapper.jsx
  </files>
  <action>
    Create a new component that:
    1. Detects Android via `navigator.userAgent` (same pattern as useUpdater.js:14)
    2. Renders `<SmoothCursor />` only on non-Android (desktop/PC)
    3. Returns null on Android/mobile
    4. Uses pointer-events: none or appropriate CSS so the cursor doesn't block clicks

    AVOID: Do not render the cursor on Android. Do not wrap clickable elements in a way that blocks interaction.
    USE: Reuse the isAndroid detection pattern from useUpdater.js. Style the cursor container with `pointer-events-none` or fixed position with high z-index but no click blocking.

  </action>
  <verify>
    `npm run build` passes. SmoothCursorWrapper.jsx exists and conditionally renders based on platform.
  </verify>
  <done>
    SmoothCursorWrapper renders cursor on desktop only, null on Android.
  </done>
</task>

<task type="auto">
  <name>Mount SmoothCursorWrapper in App.jsx</name>
  <files>
    src/App.jsx
  </files>
  <action>
    1. Import SmoothCursorWrapper from ./components/SmoothCursorWrapper.
    2. Mount it inside the root div (after OrganicMeshBackground, before the nav), so it spans the full viewport.
    3. Position it fixed, full-screen, pointer-events-none so it never blocks clicks.

    AVOID: Do not place the cursor inside a scrolling container that could clip it. Do not wrap interactive elements with it.
    USE: Mount as a sibling to existing root-level components (OrganicMeshBackground, SplashSequence, etc.).

  </action>
  <verify>
    `npm run build` passes. App.jsx imports and renders SmoothCursorWrapper.
  </verify>
  <done>
    SmoothCursorWrapper mounted in App.jsx root layout.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] `npm run build` exits 0
- [ ] components.json exists (shadcn config)
- [ ] src/components/ui/smooth-cursor.jsx exists
- [ ] src/components/SmoothCursorWrapper.jsx exists
- [ ] App.jsx imports and renders SmoothCursorWrapper
- [ ] Cursor does not render on Android (isAndroid check present)

## Success Criteria

- [ ] All tasks verified passing
- [ ] Must-haves confirmed: desktop-only cursor, build passes, no click interference