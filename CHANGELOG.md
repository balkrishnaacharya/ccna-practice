# Changelog

All notable changes to CCNA 2.0 Practice are documented here.

## Unreleased

### Question bank
- Grew the bank from ~1,900 to **2,007 unique questions** across the 5 CCNA 2.0 domains
  (`network_infra`, `switching`, `ip_routing`, `services_security`, `ai_ops`).
- Audited batches 23–35 (724 questions): all schema-valid; 614 were exact
  duplicates of existing bank items and were filtered out; 109 genuinely new
  questions were imported.
- Tightened the bank by removing 2 concept-overlapping duplicates (AAAA DNS record
  definition, OSPF ABR definition) — kept the stronger versions.
- Bank remains at goal (2,000+) with 0 duplicates and 0 invalid rows;
  `npm run bank:check` passes.

### Bug fixes
- **Updater download button did nothing.** The Settings "Update Available" flow
  hands release URLs to the OS browser via `window.open()`, which is a no-op
  inside the Tauri webview. Replaced both `window.open()` calls in
  `src/utils/useUpdater.js` with `@tauri-apps/plugin-shell`'s `open()`
  (with a `window.open` fallback for non-Tauri/dev contexts). The shell plugin
  is already registered in `src-tauri/src/lib.rs` and `shell:default` permits
  opening `http(s)://` links, so no capability change was required.