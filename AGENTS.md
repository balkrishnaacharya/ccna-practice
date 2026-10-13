# AGENTS.md — CCNA Practice Project

This file is read by Antigravity agents before starting any task.

## Project Overview

A local-first CCNA 2.0 practice app built with Tauri 2.0 (Rust + React). Questions are stored in SQLite. The app must work on **Windows, Linux, and Android**.

## Stack Rules

- **Frontend:** React + Vite + Tailwind. No component libraries. Keep it simple.
- **Backend:** Rust + rusqlite. No ORM. Write raw SQL.
- **Database:** SQLite only. One file: `ccna.db` in the app data directory.
- **No network calls from the app itself.** All data is local.
- **No authentication.** Single-user local app.

## Code Style

- Rust: use `thiserror` for error types, `serde` for serialization.
- React: functional components only. No class components.
- CSS: Tailwind utility classes. No inline styles unless dynamic.
- Comments: explain *why*, not *what*. Keep them sparse.

## Domain Vocabulary

- **Domain:** one of `network_infra`, `switching`, `ip_routing`, `services_security`, `ai_ops`.
- **Difficulty:** one of `easy`, `medium`, `hard`.
- **Mode:** one of `easy`, `medium`, `hard`, `impossible`, `exam`.

## Question Pipeline

- Import JSON: `pipeline/import-questions.js`
- Schema: see `questions.sample.json`
- AI generation: use the `question-generator` subagent.
- Scraping: use the `scraper` subagent, but **only** for sources you have permission to scrape.

## Testing

- Run `npm run tauri dev` to start the app.
- Run `node pipeline/import-questions.js questions.sample.json` to seed the DB.
- Use the `qa-tester` subagent for UI checks.

## Do Not

- Do not add a server or network layer.
- Do not add user authentication.
- Do not scrape Cisco NetAcad or any paywalled site.
- Do not commit `ccna.db` or any `.env` files.
