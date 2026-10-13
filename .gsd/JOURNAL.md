# Validation journal

## Cross-platform GitHub Actions build

- 2026-10-13: `npm run build` passed (Vite 5.4.21; 48 modules transformed).
- 2026-10-13: `CARGO_TARGET_DIR=/tmp/ccna-practice-build npm run tauri -- build --bundles deb,rpm` passed and produced `.deb` and `.rpm` packages.
- 2026-10-13: Android APK build reached Rust compilation, then failed in the local Cargo registry because `tauri-plugin-shell` could not copy its generated API into an already existing `.tauri/tauri-api/` directory. GitHub Actions uses a clean runner; CI remains the verification for Android and Windows.
- 2026-10-13: The default Linux build produced `.deb` and `.rpm` before stalling at AppImage bundling in this restricted local environment.
- 2026-10-13: GitHub Actions passed all three native builds and uploaded their artifacts. The first release attempt used a recursive file glob that included unpacked AppImage contents, creating many non-installer release assets and failing during duplicate asset uploads. The workflow now filters release assets to installer extensions and removes non-installer files from an existing release before publishing.
