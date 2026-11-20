# CLAUDE.md — TMDB Year, Country & Rating Catalog Addon

## 1. Project Overview
**TMDB Year, Country & Rating Catalog Addon** is a catalog addon for **Stremio**, **Nuvio**, and **Alder** implementing the **Stremio Addon Protocol v3**.

It organizes movies and series by:
- **Release Year & Decade:** individual years from current year down to 2020, plus ranges (`2015 - 2019`, `2000s`, `90s`, `80s`, `70s`, `Classics (<1970)`).
- **Production Regions:** Europe, Spain, United States, Latin America, Asia, or Worldwide.
- **TMDB Rating Thresholds:** 7.0+, 7.5+, 8.0+, 8.5+, or any.
- **Smart Search:** natural language search queries (`2023 8+`, `dune 2024`, `year:2021 rating:7.5`).
- **Rating Badges:** optional integration with RatingPosterDB (RPDB).

As a pure catalog addon (`resources: ['catalog']`), it does not serve video streams directly. It resolves and outputs standard IMDb IDs (`tt...`), enabling stream addons (Torrentio, Comet, Debrid, etc.) and player metadata providers to resolve streams seamlessly.

---

## 2. Universal Compatibility
- **Official Stremio:** Desktop (Windows, macOS, Linux), Android (Mobile and TV), Web, and Samsung/LG Smart TVs.
- **Nuvio / NuvioMobile:** Via `Settings ➔ Addons` using the manifest URL.
- **Alder:** Synchronized automatically via Stremio account.

---

## 3. Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | Node.js (>= 22) | Modern ESM, native `.env` loader. |
| **Framework** | [Hono](https://hono.dev/) (`@hono/node-server`) | Ultra-fast, lightweight HTTP framework. |
| **Deployment** | Vercel Serverless / Node.js / Docker | `api/index.ts` (Vercel) and `src/node.ts` (Node/Docker) serve `src/app.ts`. Vercel runs `npm run vercel-build` (typecheck + unit tests): failing tests block the deploy. |
| **Shared kit** | `src/kit/` (Pina addon kit) | Platform routes, usage metrics, config decoding, upstream fetch, i18n rule. Synced from `pina-stremio-addon` (`npm run kit:sync`); never edit it here. |
| **Protocol** | Stremio Protocol v3 | Direct REST/JSON implementation. |
| **Data Provider** | TheMovieDB (TMDB) API v3 | `/discover` and `/search` endpoints. |
| **Caching Layer** | In-memory `lru-cache` + Vercel Edge CDN `s-maxage` | Sub-5ms response times. |
| **ID Mapping** | TMDB ID ➔ IMDb ID (`tt...`) | High compatibility with stream addons. |

---

## 4. Key Commands

```bash
npm run dev               # Local development with tsx watch (http://localhost:7000)
npm run typecheck         # Full TypeScript check (code and tests)
npm run build             # Compile TypeScript to dist/
npm start                 # Run compiled app
npm test                  # Run all tests
npm run test:unit         # Run mock tests without network calls
npm run test:integration  # Run integration tests against real TMDB API
npm run vercel-build      # What Vercel runs: typecheck + unit tests
```

---

## 5. Shared Architecture (Pina addon kit)

This addon shares its base with the Pina add-ons (PinaStreams, PinaSports): see `docs/PINA_ADDON_KIT.md`.

- `src/kit/` is a **synced copy** (KIT_VERSION in `src/kit/brand.ts`). Changes go to `pina-stremio-addon/src/kit` and come back with `npm run kit:sync -- ../imdb-year-catalog-addon` from that repo.
- `createAddonApp` (src/app.ts) mounts root -> /configure, /configure, /logo.png (this addon's own star logo, not a Pina glyph), /favicon.ico, /robots.txt, /health (+ `tmdbKeyConfigured`), /stats.json, CORS, JSON 404/500 and the request log, which is **opt-in** (`LOG_REQUESTS=1`) and never writes the config segment.
- Usage metrics: `getUsageCounter()` from the kit. Identity stays the user's TMDB key, so existing hashes are unchanged. Rows are written by the first request of each UTC hour, and own tooling (`pina-tools/*`) is ignored.
- `tmdbClient` uses the kit's `fetchJson` (timeout, capped retries, no retry on 4xx) and `mapWithConcurrency`. Both originated here.
- Language rule (same in the whole family): the install's `language` -> the visitor's saved choice (localStorage `pina_lang`) -> Spanish if the browser lists it anywhere -> English. The server sets `<html lang>` with that rule. `language` also localizes the manifest and catalogs.
- Tests: `tests/helpers/hermeticEnv.ts` clears the metrics variables before the unit tests, because the Vercel build runs them with the project's variables.
