# CCNA 2.0 Practice — Cross-Platform Starter (Tauri 2.0)

A local-first CCNA 2.0 practice app that runs on **Windows, Linux, and Android** from a single codebase.

## Stack

- **Tauri 2.0** — cross-platform shell (desktop + Android from one codebase)
- **React + Vite + Tailwind** — frontend UI
- **Rust + rusqlite** — local SQLite database, zero server needed
- **Antigravity subagents** — question generation pipeline

## Why Tauri 2.0?

| | Tauri 2.0 | Electron | Capacitor | Flutter |
|---|---|---|---|---|
| Windows / Linux | ✅ | ✅ | ✅ (via Electron host) | ✅ |
| Android | ✅ | ❌ | ✅ | ✅ |
| Bundle size | ~5–10 MB | ~100–150 MB | WebView-based | ~15–20 MB |
| Memory (idle) | ~30–40 MB | ~200–300 MB | N/A | ~50 MB |
| Frontend stack | Any web stack | Any web stack | Any web stack | Dart only |

Tauri 2.0 is the only option that gives you **native desktop + Android from the same web frontend** with a tiny binary. Capacitor is the fallback if you want an App Store–friendly Android build; Flutter is the alternative if you prefer Dart over React.

## Quick Start (Desktop)

```bash
# 1. Install prerequisites
#    Rust: https://rustup.rs
#    Node: https://nodejs.org
#    Tauri CLI: cargo install tauri-cli --version "^2.0.0"

# 2. Install dependencies
npm install

# 3. Run in dev mode (hot reload)
npm run tauri dev

# 4. Build production binaries
npm run tauri build
```

The SQLite database is created automatically at:

- **Windows:** `%APPDATA%\ccna-practice\ccna.db`
- **Linux:** `~/.local/share/ccna-practice/ccna.db`
- **Android:** app-private storage

## Android Build

```
# 1. Install Android SDK + NDK (via Android Studio)
# 2. Set environment variables
export ANDROID_HOME=$HOME/Android/Sdk
export NDK_HOME=$ANDROID_HOME/ndk/26.1.10909125

# 3. Initialize Android project (first time only)
npm run tauri android init

# 4. Run on emulator or device
npm run tauri android dev

# 5. Build APK
npm run tauri android build
```

## Question Pipeline

The `pipeline/` folder contains a Node script that imports questions into SQLite.

```
# Generate AI questions (requires Antigravity agent)
# — see .agents/agents/question-generator.md

# Or import from a JSON file
node pipeline/import-questions.js questions.json
```

## Project Structure

```
.
├── src/                      # React frontend
│   ├── components/           # UI components
│   ├── pages/                # Screens (Dashboard, Quiz, Review)
│   └── lib/                  # API wrappers
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── main.rs           # Tauri entry point
│   │   ├── db.rs             # SQLite schema + queries
│   │   └── commands.rs       # Tauri IPC commands
│   └── Cargo.toml
├── pipeline/                 # Question import scripts
├── .agents/agents/           # Antigravity subagent definitions
├── skills/                   # Antigravity skills
├── mcp_config.json           # MCP server config for Antigravity
└── questions.sample.json     # Sample question bank
```

## Antigravity Setup

1. Open this folder in Antigravity IDE.
2. Copy `mcp_config.json` to `~/.gemini/antigravity/mcp_config.json` (merge with existing).
3. The subagents in `.agents/agents/` are auto-discovered.
4. Use `/browser` slash command for scraping tasks.

## Difficulty Modes

| Mode ↕▾ | How it works ↕▾ |
|---|---|
| −Easy | `difficulty = 'easy'`, no timer |
| Medium | `difficulty = 'medium'`, 90s/question |
| Hard | `difficulty = 'hard'`, 60s/question |
| Impossible | Hardest questions, multi-select, no partial credit |
| Exam-like | Timed 120min, weighted by blueprint (25/25/20/20/10) |
⚙

## License

MIT — use it, fork it, ship it.

