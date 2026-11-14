---
phase: 2
plan: 2.4
wave: 1
depends_on: []
files_modified:
  - .github/workflows/build.yml
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Android build no longer waits for desktop builds to complete"
    - "Rust cargo cache persists across CI jobs to avoid recompilation"
  artifacts:
    - ".github/workflows/build.yml: build-android no longer needs build-desktop"
    - ".github/workflows/build.yml: cargo cache action added"
    - ".github/workflows/build.yml: npm cache shared across jobs"
  key_links:
    - "build.yml:68: build-android needs: build-desktop (unnecessary serialization)"
    - "build.yml:37: rust-toolchain setup without cache"
    - "build.yml:46: npm ci runs separately in each job"
---

# Plan 2.4: Speed Up GitHub Actions CI

## Objective

Optimize the GitHub Actions workflow to reduce build time. Key issues:
1. `build-android` `needs: build-desktop` — serializes independent builds (Android doesn't need desktop output)
2. No Rust cargo cache — recompiles dependencies every job
3. Node modules reinstalled in each job without cross-job caching

Purpose: Reduce total CI time by parallelizing independent jobs and caching dependencies.
Output: Faster build.yml with parallel desktop+android builds and dependency caching.

## Context

Load these files for context:
- .github/workflows/build.yml — full CI workflow (210 lines)
- build.yml:18-65 — build-desktop job (ubuntu + windows matrix)
- build.yml:66-172 — build-android job (needs build-desktop)
- build.yml:174-210 — attach-android job

## Tasks

<task type="auto">
  <name>Parallelize Android build — remove needs: build-desktop</name>
  <files>
    .github/workflows/build.yml
  </files>
  <action>
    Remove `needs: build-desktop` from the `build-android` job (line 68). The Android build does not depend on any desktop build output — it compiles independently. This allows desktop and Android builds to run in parallel, reducing total CI time.

    Also remove `needs: build-android` from `attach-android`? No — attach-android genuinely needs the Android APK artifact, so keep that dependency.

    AVOID: Do not remove needs: build-android from attach-android (it genuinely needs the APK). Do not change the desktop matrix or Android build steps.
    USE: Simply delete the `needs: build-desktop` line from build-android.

  </action>
  <verify>
    The YAML remains valid. build-android no longer has needs: build-desktop. attach-android still needs build-android.
  </verify>
  <done>
    build-android runs in parallel with build-desktop (no needs dependency).
  </done>
</task>

<task type="auto">
  <name>Add Rust cargo cache and shared npm cache across jobs</name>
  .github/workflows/build.yml
  - Add `actions/cache` for Rust: cache `~/.cargo/registry` and `~/.cargo/git` and `src-tauri/target` across jobs
  - Add `actions/cache` for Node: cache `node_modules` with a key based on package-lock.json hash
  - Place cache steps after toolchain setup, before npm ci / cargo build

    AVOID: Do not break existing steps. Do not change the tauri-action or Android signing steps. Do not add new secrets or external services.
    USE: `actions/cache@v4` with appropriate keys. Rust cache key: `cargo-${{ runner.os }}-${{ hashFiles('src-tauri/Cargo.lock') }}`. Node cache key: `node-${{ runner.os }}-${{ hashFiles('package-lock.json') }}`.

  </action>
  <verify>
    YAML is valid. Cache steps present in both build-desktop and build-android jobs.
  </verify>
  <done>
    Cargo and node_modules caches added to both build jobs.
  </done>
</task>

## Verification

After all tasks complete, verify:
- [ ] YAML syntax is valid (no indentation errors)
- [ ] build-android no longer has needs: build-desktop
- [ ] attach-android still needs build-android
- [ ] cargo cache action present in both jobs
- [ ] node_modules cache action present in both jobs

## Success Criteria

- [ ] All tasks verified passing
- [ ] Must-haves confirmed: parallel builds, dependency caching