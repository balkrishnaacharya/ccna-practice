# CCNA 2.0 Practice — Cross-Platform (Tauri 2.0)

A local-first, privacy-focused CCNA 2.0 practice application running natively on **Windows, Linux, and Android** from a unified codebase.

[![Release](https://img.shields.io/github/v/release/balkrishnaacharya/ccna-practice?include_prereleases&label=Latest%20Release)](https://github.com/balkrishnaacharya/ccna-practice/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/balkrishnaacharya/ccna-practice/build.yml?label=CI%2FCD)](https://github.com/balkrishnaacharya/ccna-practice/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Downloads

The app version is `0.6.8`. Download the latest published artifacts from the [GitHub Releases](https://github.com/balkrishnaacharya/ccna-practice/releases) page.

---

## Screenshots

> Placeholder — drop captured images or a short GIF into `docs/screenshots/` and
> reference them here once the UI is final.

| Dashboard | Practice | Exam |
|---|---|---|
| `docs/screenshots/dashboard.png` | `docs/screenshots/practice.png` | `docs/screenshots/exam.png` |

---

## Key Features

- **Dark-First Editorial Aesthetic:** Editorial dark palette (`#181815` warm dark, `#BD8D39` agent gold, `#93AB80` sage, `#C36842` heart) paired with high-contrast serif typography (system serif stack) and clean sans-serif (system sans stack).
- **Polpharma-Inspired Splash Animation:** Smooth opening identity sequence with micro-interactions powered by GSAP.
- **Directional Navigation & Floating Dock:** Hierarchy-aware transitions and responsive elevated action trigger dock.
- **Timed Exam Engine:** Full 120-minute blueprint-weighted mock exams (25% Network Fundamentals, 25% Network Access, 20% IP Connectivity, 20% IP Services & Security, 10% Automation/AI-Ops) with modal confirmation guards.
- **Local-First SQLite Engine:** All question banks, progress metrics, and review histories persist entirely offline via Rust (`rusqlite`). No server or network connectivity required.
- **Spaced Anti-Repeat & Randomization:** Weighted decay algorithm ensures question bank coverage while randomizing choice placement (`ORDER BY RANDOM()`).
- **Weak Spots Mode:** A drill mode that ranks subtopics by your actual accuracy — under-70% subtopics first, then seen-but-passing, then unseen — so study time goes where the marks are missing.
- **Weak Areas Panel:** The dashboard surfaces your five weakest attempted subtopics with accuracy bars and a one-click jump into a drill session.
- **Topic Drill:** A `/topics` browser lists every subtopic with its question count, seen count, and accuracy bar, and links straight into a filtered drill for that exact domain/subtopic.
- **Subtopic Coverage Report:** `bank:stats` reports per-subtopic counts, not just per-domain totals, and flags every subtopic with fewer than four questions.
- **Keyboard-First Answering:** `1`–`4` select a choice, `Enter` submits or advances, so a full set can be drilled without touching the mouse.
- **Study Streak & Daily Goal:** A dashboard panel tracks consecutive study days and today's progress against a 12-question default goal, with a seven-day activity strip. Any answer keeps the run alive; the goal only measures how much of today is done. The target is editable in Settings and stored locally in `settings`.
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

## Practice Modes

| Mode | Behavior |
|---|---|
| **Easy / Medium / Hard** | Filters the pool by question difficulty. |
| **Impossible** | The hardest tier — long stems, multi-step reasoning, close distractors. |
| **Exam** | 120-minute, blueprint-weighted mock exam with a question navigator and confirmation guards. |
| **Weak Spots** | Ignores difficulty and ranks subtopics by *your* accuracy, so the questions you get wrong come back first. |

Weak Spots is also reachable directly at `/quiz?mode=weak`, which is what the
dashboard's **Weak Areas** panel links to.

### Topic Drill

`/topics` lists every subtopic grouped by domain and links to
`/quiz?mode=weak&domain=<domain>&subtopic=<subtopic>`. Both filters are optional:
pass only `domain` to drill a whole domain, or only `subtopic` to drill that topic
across domains. Difficulty tiers still apply when you switch to Easy/Medium/Hard
inside a drill; Weak Spots and Exam span every difficulty so a thin topic is never
empty. Blank subtopics are grouped as `Uncategorized`, matching the stats query.

---

## Quick Start

```bash
git clone https://github.com/balkrishnaacharya/ccna-practice.git
cd ccna-practice
npm install
npm run tauri dev
```

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
# Validate + import questions from a JSON file into ccna.db
npm run import -- pipeline/data/network_infra.json

# Preview what would be imported without touching the database
npm run import -- pipeline/data/network_infra.json --dry-run

# Assemble all domain files, validate, and import the full bank
npm run bank:build
```

### Uniqueness

Duplicate detection is **content-based**, not id- or stem-based. A question is
fingerprinted as:

```
sha256(normalized stem + sorted normalized choice texts)
```

The fingerprint ignores option order, casing, punctuation, and `id`, so the same
question re-imported with shuffled answers or edited metadata is rejected. The
`questions.content_hash` column has a unique index, so uniqueness is enforced by
the database as well as the importer.

### Bank health

```bash
npm run bank:stats    # size, duplicates, per-domain coverage vs 2,000
npm run bank:check    # same, but exits non-zero on duplicates/invalid rows
```

`bank:check` is suitable for CI: it fails the build if a duplicate or malformed
question enters the bank.

---

## Roadmap

The app is a solid local practice tool (**9/10**). The question bank has reached
its 2,000-question goal, so the focus shifts to app features and quality.

**Current bank:** 2,307 unique questions, 0 duplicates, 0 invalid.

Domain mix (goal weight in brackets):

| Domain | Questions | Share |
|---|---|---|
| `network_infra` | 582 | 25.2% |
| `switching` | 478 | 20.7% |
| `ip_routing` | 519 | 22.5% |
| `services_security` | 462 | 20.0% |
| `ai_ops` | 266 | 11.5% |

Difficulty mix: 797 easy / 1,057 medium / 453 hard.

Priorities:
1. **Add spaced repetition.** `user_question_stats` already records seen/correct
   counts - scheduling reviews from it (SM-2 style) would beat random sampling.
2. **Test the Android build on a real device.** Desktop and CI are exercised;
   touch input, back-button handling, and the 120-minute exam timer on mobile
   are not.
3. **Keep a screenshot-based UI regression check** for the quiz, exam navigator,
   and results screens.
4. **Maintenance:** run `npm run bank:check` after any question edits.

---

## Update System

### Desktop (Windows / Linux)
- The Tauri 2.0 updater plugin checks for new releases on every startup (3-second delay) or on-demand via **Check for Updates**.
- When an update is available, the user can download and install it directly, which automatically relaunches the app.
- The updater manifest (`latest.json`) is hosted at `https://github.com/balkrishnaacharya/ccna-practice/releases/latest/download/latest.json` and contains version, release notes, and platform-specific download URLs with signatures.
- **Signing**: A RSA private key (stored as `TAURI_SIGNING_PRIVATE_KEY` GitHub secret) signs the desktop binaries and the `latest.json` manifest. The public key is embedded in `tauri.conf.json` → `plugins.updater.pubkey`.
- ** CI**: GitHub Actions (`build.yml`) builds, signs artifacts, generates `latest.json`, and uploads it as a release asset on every `v*` push.

### Android
- The Tauri updater plugin **does not support Android**. Updates are handled manually.
- Users can open the **GitHub Releases** page or the **Play Store** (if published) to download the latest APK.
- A **Check for Updates** button in Settings opens the GitHub Releases page directly.
- APKs are signed with a pinned release keystore; certificate fingerprints are verified in the CI pipeline (`ANDROID_CERT_SHA256`).

### Linux Dependencies
- The Linux build requires `libnotify4` (or `libnotify-bin` for `notify-send`) for native desktop notifications.
- Debian/Ubuntu: `sudo apt-get install libnotify4`
- Fedora: `sudo dnf install libnotify`
- Arch: `sudo pacman -S libnotify`
- If `libnotify` is unavailable, notifications fallback to a best-effort console warning.

### Notification Permission Workflow
- **Desktop (Windows / Linux)**: Permission is auto-granted on first notification attempt — no system prompt.
- **Android 13+**: The first `showNotification()` call triggers the system `POST_NOTIFICATIONS` permission dialog. Call `initNotifications()` on app startup to pre-request permission early in the session.
- **Permission state** is persistently stored per-platform and checked via `@tauri-apps/plugin-notification`.

---
## License

MIT License — see [LICENSE](LICENSE) for details.
