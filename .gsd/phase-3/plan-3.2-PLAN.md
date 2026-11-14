---
phase: 3
plan: 3.2
wave: 1
depends_on: []
files_modified:
  - src/components/OrganicMeshBackground.jsx
  - src/components/FloatingBottomNav.jsx
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Mesh background blur reduced on mobile to save GPU"
    - "GSAP pill animation respects prefers-reduced-motion"
  artifacts:
    - "src/components/OrganicMeshBackground.jsx — blur reduced, mobile-aware"
    - "src/components/FloatingBottomNav.jsx — prefers-reduced-motion guard on pill GSAP"
  key_links:
    - "OrganicMeshBackground.jsx:38-61 — blur-[75px], blur-[80px], blur-[90px] on large blobs"
    - "FloatingBottomNav.jsx:137-142 — useGSAP pill animation without prefers-reduced-motion check"
---

# Plan 3.2: Mobile Speed & GPU Performance

## Objective

Reduce GPU cost on mobile devices: (1) lower the mesh background blur intensity and skip animation on low-end/Android, (2) add `prefers-reduced-motion` guard to the FloatingBottomNav pill GSAP animation so users who request reduced motion get instant pill placement without continuous animation.

Purpose: Improve scroll/jank performance on Android and respect user motion preferences.
Output: Optimized OrganicMeshBackground and FloatingBottomNav with reduced-motion support.

## Context

Load these files for context:
- src/components/OrganicMeshBackground.jsx — blur-[75px]/[80px]/[90px] large blobs (lines 38-61)
- src/components/FloatingBottomNav.jsx — useGSAP pill animation (lines 137-142), no prefers-reduced-motion check

## Tasks

<task type="auto">
  <name>Reduce mesh background blur and add mobile-aware pause</name>
  <files>
    src/components/OrganicMeshBackground.jsx
  </files>
  <action>
    Modify OrganicMeshBackground to:
    1. Reduce blur on the three large blobs: blur-[75px]→blur-[40px], blur-[80px]→blur-[48px], blur-[90px]→blur-[56px]
    2. Reduce blob sizes: h-[30rem]/w-[30rem]→h-[20rem]/w-[20rem], etc.
    3. Add Android detection: if /android/i.test(navigator.userAgent), pause mesh animation by default (add mesh-paused class)
    4. Keep the existing visibilitychange pause behavior

    Current CSS: `blur-[75px]`, `blur-[80px]`, `blur-[90px]` with `h-[30rem]`, `h-[32rem]`, `h-[24rem]`

    AVOID: Do not remove the background entirely. Do not change color tokens. Do not break the visibilitychange pause logic.
    USE: Lower blur values and smaller blob dimensions. Add Android check similar to useUpdater.js line 14 pattern.

  </action>
  <verify>
    `npm run build` passes. OrganicMeshBackground has reduced blur values (< blur-[60px]) and Android pause logic.
  </verify>
  <done>
    Mesh background blur reduced, Android pauses mesh by default.
  </done>
</task>

<task type="auto">
  <name>Add prefers-reduced-motion guard to pill animation</name>
  <files>
    src/components/FloatingBottomNav.jsx
  </files>
  <action>
    Add a `prefers-reduced-motion` check in the FloatingBottomNav useGSAP callback:
    1. At the start of the callback, check `window.matchMedia("(prefers-reduced-motion: reduce)").matches`
    2. If true, call `gsap.set(pillEl, { ... })` for instant placement (no animation) and return early
    3. Also skip the icon scale pop animation when reduced motion is active

    AVOID: Do not remove the pill animation entirely for non-reduced-motion users. Do not break the resize listener.
    USE: Same pattern as SplashSequence.jsx line 25 (prefers-reduced-motion check).

  </action>
  <verify>
    `npm run build` passes. FloatingBottomNav useGSAP callback checks prefers-reduced-motion and uses gsap.set() when active.
  </verify>
  <done>
    Pill animation skipped when prefers-reduced-motion is active.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] `npm run build` exits 0
- [ ] OrganicMeshBackground blur values reduced below blur-[60px]
- [ ] OrganicMeshBackground pauses on Android
- [ ] FloatingBottomNav checks prefers-reduced-motion

## Success Criteria

- [ ] All tasks verified passing
- [ ] Must-haves confirmed: reduced GPU cost on mobile, reduced-motion respected