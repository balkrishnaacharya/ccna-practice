---
phase: 6
plan: 6.1
wave: 1
depends_on: []
files_modified:
  - package.json
  - Cargo.toml
  - src-tauri/Cargo.toml
  - .github/workflows/build.yml
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Version is 0.6.0 in package.json, Cargo.toml, and src-tauri/Cargo.toml"
    - "GitHub Actions workflow has restore-keys for partial cache hits"
    - "GitHub Actions workflow caches Gradle dependencies for Android"
    - "GitHub Actions workflow uses fetch-depth: 1 on checkout"
  artifacts:
    - "package.json version = 0.6.0"
    - "Cargo.toml version = 0.6.0"
    - "src-tauri/Cargo.toml version = 0.6.0"
    - ".github/workflows/build.yml optimized for speed"
  key_links:
    - "package.json:3 — version field"
    - "Cargo.toml:1 — version field"
    - "src-tauri/Cargo.toml:3 — version field"
    - ".github/workflows/build.yml — CI/CD workflow"
---

# Plan 6.1: Version Bump 0.6.0 + GitHub Actions Speed Optimizations

## Objective

Bump the app version from 0.5.1 to 0.6.0 across all version files, and optimize the GitHub Actions workflow for faster builds.

Purpose: Prepare a release with improved CI speed so future builds complete quicker.
Output: Updated version files, optimized workflow, ready to commit/tag/push.

## Context

Load these files for context:
- package.json:3 — version field
- Cargo.toml:1 — version field  
- src-tauri/Cargo.toml:3 — version field
- .github/workflows/build.yml — full CI/CD workflow (239 lines)

## Tasks

<task type="auto">
  <name>Bump version to 0.6.0 in all version files</name>
  <files>
    package.json
    Cargo.toml
    src-tauri/Cargo.toml
  </files>
  <action>
    Update version from "0.5.1" to "0.6.0" in:
    - package.json line 3
    - Cargo.toml line 1 (root)
    - src-tauri/Cargo.toml line 3

    AVOID: Do not change any other fields. Do not change dependency versions. Do not modify the version in any other file.
    USE: Exact string replacement of "0.5.1" → "0.6.0" in version fields only.

  </action>
  <verify>
    `grep -rn "0.6.0" package.json Cargo.toml src-tauri/Cargo.toml` returns 3 matches. `grep -rn "0.5.1" package.json Cargo.toml src-tauri/Cargo.toml` returns 0 matches.
  </verify>
  <done>
    All three version files show 0.6.0, none show 0.5.1.
  </done>
</task>

<task type="auto">
  <name>Speed up GitHub Actions workflow</name>
  <files>
    .github/workflows/build.yml
  </files>
  <action>
    Apply these speed optimizations to build.yml:

    1. Add `restore-keys` to Node modules cache in both build-desktop and build-android jobs for partial cache hits:
       `restore-keys: |`
       `  node-${{ runner.os }}-`

    2. Add `restore-keys` to Rust compilation cache in both jobs:
       `restore-keys: |`
       `  cargo-${{ runner.os }}-`

    3. Add Gradle cache for Android build (build-android job), after Set up Java:
       ```yaml
       - name: Cache Gradle packages
         uses: actions/cache@v4
         with:
           path: |
             ~/.gradle/caches
             ~/.gradle/wrapper
           key: gradle-${{ runner.os }}-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
           restore-keys: |
             gradle-${{ runner.os }}-
       ```

    4. Add `fetch-depth: 1` to both `actions/checkout@v4` steps (shallow clone = faster checkout).

    5. Pin `tauri-action` to a specific version instead of `@v0`: change `tauri-apps/tauri-action@v0` to `tauri-apps/tauri-action@v2` (or latest stable).

    AVOID: Do not change the job structure, matrix, release logic, or signing steps. Do not remove existing cache actions. Do not change the Android SDK packages or signing process.
    USE: Add restore-keys to existing caches, add new Gradle cache, add fetch-depth: 1, pin tauri-action version.

  </action>
  <verify>
    `npm run build` exits 0 (workflow YAML is valid). `grep -c "restore-keys" .github/workflows/build.yml` returns >= 4. `grep -c "fetch-depth: 1" .github/workflows/build.yml` returns 2. `grep "tauri-action@v2" .github/workflows/build.yml` returns 1 match.
  </verify>
  <done>
    Workflow has restore-keys on all caches, fetch-depth: 1 on both checkouts, Gradle cache for Android, pinned tauri-action version.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] All three version files show 0.6.0
- [ ] Workflow has restore-keys on Node + Rust caches (both jobs)
- [ ] Workflow has Gradle cache for Android
- [ ] Workflow has fetch-depth: 1 on both checkout steps
- [ ] Workflow pins tauri-action@v2
- [ ] `npm run build` passes

## Success Criteria

- [ ] All tasks verified passing
- [ ] Must-haves confirmed: version 0.6.0 everywhere, workflow speedups applied