# CCNA 2.0 Practice — Cross-Platform (Tauri 2.0)

A local-first, privacy-focused CCNA 2.0 practice application running natively on **Windows, Linux, and Android** from a unified codebase.

[![Release](https://img.shields.io/github/v/release/balkrishnaacharya/ccna-practice?include_prereleases&label=Latest%20Release)](https://github.com/balkrishnaacharya/ccna-practice/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/balkrishnaacharya/ccna-practice/build.yml?label=CI%2FCD)](https://github.com/balkrishnaacharya/ccna-practice/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Downloads (Latest Release: [v0.2.0-beta.2](https://github.com/balkrishnaacharya/ccna-practice/releases/tag/v0.2.0-beta.2))

| Platform | Format | Direct Download |
|---|---|---|
| **Android** | Signed APK (`arm64-v8a`) | [ccna-practice-v0.2.0-beta.2-android-aarch64.apk](https://github.com/balkrishnaacharya/ccna-practice/releases/download/v0.2.0-beta.2/ccna-practice-v0.2.0-beta.2-android-aarch64.apk) |
| **Linux** | AppImage | [CCNA.Practice_0.2.0_amd64.AppImage](https://github.com/balkrishnaacharya/ccna-practice/releases/download/v0.2.0-beta.2/CCNA.Practice_0.2.0_amd64.AppImage) |
| **Linux** | Debian / Ubuntu (`.deb`) | [CCNA.Practice_0.2.0_amd64.deb](https://github.com/balkrishnaacharya/ccna-practice/releases/download/v0.2.0-beta.2/CCNA.Practice_0.2.0_amd64.deb) |
| **Linux** | Fedora / RHEL (`.rpm`) | [CCNA.Practice-0.2.0-1.x86_64.rpm](https://github.com/balkrishnaacharya/ccna-practice/releases/download/v0.2.0-beta.2/CCNA.Practice-0.2.0-1.x86_64.rpm) |
| **Windows** | Setup Installer (`.exe`) | [CCNA.Practice_0.2.0_x64-setup.exe](https://github.com/balkrishnaacharya/ccna-practice/releases/download/v0.2.0-beta.2/CCNA.Practice_0.2.0_x64-setup.exe) |
| **Windows** | MSI Package (`.msi`) | [CCNA.Practice_0.2.0_x64_en-US.msi](https://github.com/balkrishnaacharya/ccna-practice/releases/download/v0.2.0-beta.2/CCNA.Practice_0.2.0_x64_en-US.msi) |

---

## Key Features

- **Dark-First Editorial Aesthetic:** Editorial dark palette (`#181815` warm dark, `#B8842A` agent gold, `#5C6E4E` sage, `#C1633C` heart) paired with high-contrast serif typography (`Playfair Display`) and clean sans-serif (`Inter`).
- **Polpharma-Inspired Splash Animation:** Smooth opening identity sequence with micro-interactions powered by GSAP.
- **Directional Navigation & Floating Dock:** Hierarchy-aware transitions and responsive elevated action trigger dock.
- **Timed Exam Engine:** Full 120-minute blueprint-weighted mock exams (25% Network Fundamentals, 25% Network Access, 20% IP Connectivity, 20% IP Services & Security, 10% Automation/AI-Ops) with modal confirmation guards.
- **Local-First SQLite Engine:** All question banks, progress metrics, and review histories persist entirely offline via Rust (`rusqlite`). No server or network connectivity required.
- **Spaced Anti-Repeat & Randomization:** Weighted decay algorithm ensures question bank coverage while randomizing choice placement (`ORDER BY RANDOM()`).
- **Cryptographically Signed Releases:** Fail-closed Android signing pipeline with pinned certificate fingerprints (v2/v3 signature schemes).

---

## Tech Stack

- **Desktop & Android Shell:** [Tauri 2.0](https://v2.tauri.app/) (Rust + Webview)
- **Frontend UI:** React 18, Vite, Tailwind CSS
- **Animation & Motion:** GSAP 3 (`@gsap/react`, `useGSAP`, `ScrollTrigger`)
- **Database:** Local SQLite 3 via `rusqlite`
- **Testing:** Node.js native test runner (`node:test`)
- **CI/CD:** GitHub Actions with automated cross-platform bundling & release publishing

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** (v18+)
- **Rust Toolchain:** [rustup.rs](https://rustup.rs)
- **Tauri CLI:**
  ```bash
  cargo install tauri-cli --version "^2.0.0"
  ```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run tauri dev
```

### 4. Run Automated Tests
```bash
npm test
```

### 5. Build Desktop Installers
```bash
npm run tauri build
```

---

## Android Build & Signing

A dedicated script is included in [`release-apk/build-apk.sh`](release-apk/build-apk.sh):

```bash
# Debug build (local development with debug keystore)
./release-apk/build-apk.sh

# Production release build (strict fail-closed verification)
./release-apk/build-apk.sh --mode release \
  --keystore /path/to/release.keystore \
  --alias my-key-alias \
  --keystore-pass "mypassword" \
  --key-pass "mypassword" \
  --fingerprint "adb796a991cf024a98b77129a0f00606a51aebbd0ca1a6744700f5a0bdc275c5"
```

For full details regarding keystore generation, manual commands, and CI configuration, see the [Android Build & Signing Guide](release-apk/README.md).

---

## Question Import Pipeline

You can seed or update the local question database via the included importer:

```bash
# Import questions from a JSON file into ccna.db
node pipeline/import-questions.js questions.sample.json
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.
