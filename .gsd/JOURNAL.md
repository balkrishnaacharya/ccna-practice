# Validation journal

## Cross-platform GitHub Actions build

- 2026-10-13: `npm run build` passed (Vite 5.4.21; 48 modules transformed).
- 2026-10-13: `CARGO_TARGET_DIR=/tmp/ccna-practice-build npm run tauri -- build --bundles deb,rpm` passed and produced `.deb` and `.rpm` packages.
- 2026-10-13: Android APK build reached Rust compilation, then failed in the local Cargo registry because `tauri-plugin-shell` could not copy its generated API into an already existing `.tauri/tauri-api/` directory. GitHub Actions uses a clean runner; CI remains the verification for Android and Windows.
- 2026-10-13: The default Linux build produced `.deb` and `.rpm` before stalling at AppImage bundling in this restricted local environment.
