---
phase: 1
plan: 1.2
wave: 1
depends_on: []
files_modified:
  - src/utils/useUpdater.js
  - src-tauri/tauri.conf.json
  - src-tauri/src/lib.rs
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Android update check detects a newer version when one exists"
    - "Android APK download URL is resolved from GitHub releases"
    - "Android update installation opens the APK via the shell plugin"
  artifacts:
    - "src/utils/useUpdater.js handles Android update flow end-to-end"
    - "src-tauri/tauri.conf.json has Android-compatible updater config"
    - "src-tauri/src/lib.rs exposes shell plugin on Android"
  key_links:
    - "useUpdater.js isAndroid branch queries GitHub Releases API"
    - "applyUpdate() uses shell::open() for Android APK download"
    - "tauri.conf.json updater pubkey/endpoints for desktop"
---

# Plan 1.2: Fix Android Updater (Version Check + APK Delivery)

## Objective

Fix the Android updater so it reliably detects new versions, resolves the APK download URL from GitHub releases, and opens the APK for installation via the Tauri shell plugin. The desktop updater path (Tauri plugin) should remain intact.

Purpose: Ensure users on all platforms receive update notifications and can install new APKs when the question bank fix ships.
Output: A hardened Android updater flow in useUpdater.js plus any needed Tauri config/Rust changes.

## Context

Load these files for context:
- src/utils/useUpdater.js — full updater logic (Android + desktop paths)
- src-tauri/tauri.conf.json — updater pubkey, endpoints, createUpdaterArtifacts
- src-tauri/src/lib.rs — plugin registration (updater only on #[cfg(desktop)], shell on all)
- src/App.jsx — uses useUpdater in the Settings page context

## Tasks

<task type="auto">
  <name>Audit and harden Android updater flow</name>
  <files>
    src/utils/useUpdater.js
  </files>
  <action>
    Review the entire Android branch of checkForUpdates() and applyUpdate() in useUpdater.js. Harden the following:

    1. APK asset discovery (lines 47-49): The current filter requires a .apk asset without "unsigned" in the name. If no such asset exists, no update is offered. Add fallback: accept any .apk asset, and if none exists, fall back to data.html_url with a clear "download from GitHub" message.

    2. Version comparison (line 51): isVersionGreater() splits on "." and compares numerically. Handle tags with "v" prefix (already stripped), pre-release tags (e.g., "1.0.0-rc1"), and ensure cleanTag !== currentVersion comparison is robust.

    3. Android applyUpdate (lines 123-137): shell::open() hands the URL to the OS. Add error handling that surfaces the GitHub release URL as a fallback if shell open fails.

    4. Add a manual "Check for updates" button path that works on Android (already exists via checkForUpdates(true)).

    AVOID: Do not remove the desktop Tauri updater path. Do not change the GitHub repo constant. Do not introduce network calls beyond the GitHub API check (already present).
    USE: Existing fetch to GitHub Releases API. Keep isAndroid detection via navigator.userAgent.

  </action>
  <verify>
    `npm run build` passes (Vite build compiles useUpdater.js without errors). No TypeScript/React lint errors in the updated file.
  </verify>
  <done>
    useUpdater.js Android branch: APK asset discovery has fallback, version comparison handles edge cases, applyUpdate has fallback to release URL.
  </done>
</task>

<task type="auto">
  <name>Ensure Tauri plugins support Android update flow</name>
  <files>
    src-tauri/tauri.conf.json
    src-tauri/src/lib.rs
  </files>
  <action>
    1. In tauri.conf.json: Verify the updater plugin configuration is valid. The createUpdaterArtifacts: false is fine since Android uses the custom GitHub API check. Ensure no CSP blocks the GitHub API fetch.

    2. In lib.rs: The tauri_plugin_shell::init() is already registered on all platforms (line 11). The tauri_plugin_updater is desktop-only (line 16), which is correct — Android uses the manual GitHub check. No Rust changes needed unless audit reveals a gap.

    3. Verify the shell plugin is available on Android for the open() call in applyUpdate().

    AVOID: Do not enable the Tauri updater plugin on Android (it's not designed for APK distribution via Tauri's update mechanism). Do not add network endpoints beyond GitHub.
    USE: Keep shell plugin on all platforms. Keep updater plugin desktop-only.

  </action>
  <verify>
    `cargo check` passes in src-tauri/ (Rust compiles). tauri.conf.json is valid JSON.
  </verify>
  <done>
    tauri.conf.json valid. lib.rs compiles. Shell plugin available on Android for APK download.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] `npm run build` succeeds (frontend compiles)
- [ ] `cargo check` succeeds (Rust compiles)
- [ ] useUpdater.js Android path: APK asset found OR fallback to release URL
- [ ] Version comparison handles "v"-prefixed and pre-release tags
- [ ] applyUpdate() opens APK via shell plugin with error fallback

## Success Criteria

- [ ] All tasks verified passing
- [ ] Must-haves confirmed: Android detects updates, resolves APK URL, installs via shell
- [ ] Desktop updater path unchanged and functional
- [ ] No new network dependencies introduced