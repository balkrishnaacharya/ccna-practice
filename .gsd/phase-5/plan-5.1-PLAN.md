---
phase: 5
plan: 5.1
wave: 1
depends_on: []
files_modified:
  - src/components/SplashSequence.jsx
autonomous: true
user_setup: []
must_haves:
  truths:
    - "SplashSequence is completely replaced — no code from the previous version remains"
    - "Animation is smooth: staggered reveals, ease curves, no jank"
    - "prefers-reduced-motion is respected (instant skip to app)"
    - "Splash auto-advances to the app after animation completes"
    - "Android/touch devices get a minimal, non-blocking version"
  artifacts:
    - "src/components/SplashSequence.jsx — new smooth landing animation"
  key_links:
    - "App.jsx:31-34 — isSplashActive state controls splash visibility"
    - "App.jsx:124 — <SmoothCursorWrapper /> mounted after splash"
    - "src/styles.css:92-108 — prefers-reduced-motion + mesh-paused CSS"
---

# Plan 5.1: Replace Landing Animation with Smooth Visual Animation

## Objective

Completely replace `src/components/SplashSequence.jsx` with a new smooth landing animation. Remove all code from the previous version. The new animation should feel polished and Awwwards-inspired: staggered element reveals, smooth scale/fade/translate transitions, mesh background sync, and a clean fade-out that hands off to the app.

Purpose: Replace the minimal single-moment splash with a smooth, cinematic landing sequence that sets a premium tone when the app starts.
Output: A rewritten SplashSequence.jsx with a multi-stage GSAP timeline.

## Context

Load these files for context:
- src/components/SplashSequence.jsx — current version to be fully replaced
- src/App.jsx:31-34 — isSplashActive state; line 124 — SmoothCursorWrapper mount
- src/components/OrganicMeshBackground.jsx — mesh background that runs behind the splash
- src/styles.css:92-108 — prefers-reduced-motion and mesh-paused CSS overrides

## Tasks

<task type="auto">
  <name>Rewrite SplashSequence with smooth multi-stage animation</name>
  <files>
    src/components/SplashSequence.jsx
  </files>
  <action>
    Completely rewrite SplashSequence.jsx. Remove all previous code. Build a new component with:

    1. Session-storage gating (same as before: ccna_splash_seen) — show once per session
    2. prefers-reduced-motion guard — instant skip to app if enabled
    3. Multi-stage GSAP timeline:
       - Stage 1: Mesh background subtle scale pulse (OrganicMeshBackground behind)
       - Stage 2: Logo mark — scale from 0.6 to 1 with ease "power3.out", slight rotation
       - Stage 3: "CCNA 2.0" serif title — stagger from opacity 0, y: 20, to opacity 1, y: 0
       - Stage 4: "Blueprint 200-301" mono caption — fade/slide up
       - Stage 5: Subtle accent line — scaleX from 0 to 1
       - Stage 6: Hold ~1.2s, then fade container out over 0.5s
    4. Fail-safe safety timer (2500ms) so app is never blocked
    5. On complete: set sessionStorage, setShouldRender(false), call onComplete()
    6. All animated elements use pointerEvents: none where appropriate, will-change: transform
    7. Android/touch: minimal version (logo only, fast fade)

    AVOID: Do not keep any code from the previous SplashSequence version. Do not block user interaction (pointer-events: none on overlay). Do not remove the sessionStorage gating or prefers-reduced-motion support.
    USE: gsap.timeline with staggered fromTo tweens, ease: "power3.out"/"expo.out", will-change transforms. Follow existing App.jsx mounting pattern.

  </action>
  <verify>
    `npm run build` exits 0. SplashSequence.jsx contains no code from the previous version (no tl.fromTo with duration 0.5/0.4/0.3 pattern, no "Single orchestrated moment" comment).
  </verify>
  <done>
    SplashSequence.jsx fully replaced with smooth multi-stage animation. Build passes.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] `npm run build` exits 0
- [ ] Previous SplashSequence code fully removed (no remnants)
- [ ] Animation has multiple staggered stages (logo, title, caption, accent)
- [ ] prefers-reduced-motion skips to app instantly
- [ ] Safety timer prevents app lockout
- [ ] sessionStorage gating preserved

## Success Criteria

- [ ] Task verified passing
- [ ] Must-haves confirmed: completely replaced, smooth animation, reduced-motion respected, auto-advance works