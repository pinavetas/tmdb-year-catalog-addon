# ⭐ TMDB Year, Country & Rating · Stremio Catalog Addon

> A modern, lightweight catalog addon for **Stremio**, **Nuvio**, and **Alder** that lets you explore and search movies and series by **origin country/region**, **release year or decade**, and **TMDB user rating**, featuring smart natural language search, official genre tags, and optional rating posters.

[![Stremio Addon Protocol v3](https://img.shields.io/badge/Stremio_Protocol-v3-blue.svg)](https://github.com/Stremio/stremio-addon-sdk/tree/master/docs/protocol.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Framework-Hono-orange.svg)](https://hono.dev/)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg)](#️-deploy-on-vercel-recommended)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🚀 Features

* **🎬 Clean Native UI:** Seamlessly integrates into Stremio's Discover dropdowns without intrusive emojis or icons (`Top Movies` / `Top Series`).
* **🌐 Bilingual Support (English & Spanish):** Toggle between English and Spanish in `/configure`. Queries TMDB for localized titles, overviews, and release dates.
* **📅 Explore by Year & Decade:** Dynamic dropdown with individual years (from current year down to 2020) and grouped eras (`2015 - 2019`, `2010 - 2014`, `2000s`, `90s`, `80s`, `70s`, `Classics (<1970)`).
* **🌍 Production Regions:** Filter by 🇪🇺 Europe, 🇪🇸 Spain, 🇺🇸 United States / Hollywood, 🌎 Latin America, 🌏 Asia, or worldwide.
* **⭐ TMDB Score Threshold:** Set your minimum rating cutoff (`7.0+ Good`, `7.5+`, `8.0+ Great`, `8.5+ Masterpieces`, or any score). Cards display release year and score cleanly (e.g. `2024 · TMDB 8.2`).
* **🎨 Rating Badges on Posters (RPDB Support):** Optional integration with [RatingPosterDB (RPDB)](https://ratingposterdb.com/) to stamp sleek rating badges directly onto poster artwork.
* **🏷️ Official TMDB Genre Badges:** Automatically maps official TMDB genre tags (Action, Sci-Fi, Drama...) to each title card.
* **🔎 Smart Natural Language Search:**
  * `2023 8+` → High-rated titles from 2023
  * `dune 2024` → Search by title and release year
  * `year:2021 rating:7.5` → Explicit filter syntax
  * `>7.5 horror` → Genre/keyword with minimum score
* **Universal Stream Compatibility:** Every title resolves to an IMDb ID (`tt...`), ensuring 100% compatibility with stream addons (Torrentio, Comet, Debrid providers) and player scrapers.
* **Native Infinite Scroll:** Delivers 100-item blocks with `skip` pagination, fully compatible with continuous scroll in Stremio and Nuvio.
* **Interactive Configurator ([/configure](https://tmdb-year-catalog-addon.vercel.app/configure)):** Pre-fills settings, generates one-click install links (`stremio://`), and supports copy-paste for Nuvio/Alder.

---

## 📱 Client Compatibility

| Client | Platform | How to Install |
| :--- | :--- | :--- |
| **Stremio** | Windows, macOS, Linux, Android (Mobile & TV), Web, Smart TVs | Open `/configure` and click **Install in Stremio** (or **Install in Stremio Web**). You can also paste the manifest URL into Stremio's addon search bar. |
| **[Nuvio](https://nuvio.tv)** | Android, iOS, tablets | Go to `Settings ➔ Addons ➔ Add Addon` and paste your manifest URL (using the **Copy URL** button in `/configure`). |
| **[Alder](https://github.com/aradhyas8/Alder)** | Android TV | Synchronizes automatically through your linked Stremio account. |

---

## ⚡ Quick Start (Hosted Instance)

You can use the live public instance right away:

1. Open **[tmdb-year-catalog-addon.vercel.app/configure](https://tmdb-year-catalog-addon.vercel.app/configure)** in your browser.
2. Enter your free TMDB API key (step-by-step 2-minute guide included on the page).
3. *(Optional)* Add your RPDB key if you want rating badges stamped on poster art.
4. Select your regions, minimum score, and language.
5. Click **🚀 Install in Stremio**.

---

## ☁️ Deploy on Vercel (Recommended)

This project is built for zero-config deployment on Vercel using Hono. `src/app.ts` exports the default app, and Vercel automatically runs it as a Vercel Function with global Edge CDN caching.

### Option A: From GitHub (1-Click)
1. Fork or import this repository to your GitHub account.
2. Go to [vercel.com/new](https://vercel.com/new) and select the repository.
3. In **Settings ➔ Environment Variables**, optionally configure:

   | Variable | Required | Description | Default |
   | :--- | :---: | :--- | :--- |
   | `TMDB_API_KEY` | ❌ | Fallback TMDB key for instances without per-user configuration. | None |
   | `PUBLIC_URL` | ❌ | Custom domain URL (e.g. `https://catalog.yourdomain.com`). Inferred automatically if omitted. | None |
   | `DEFAULT_MIN_VOTES_MOVIE` | ❌ | Minimum votes threshold for movies. | `200` |
   | `DEFAULT_MIN_VOTES_SERIES` | ❌ | Minimum votes threshold for series. | `50` |
   | `TMDB_LANGUAGE` | ❌ | Default metadata language. | `en-US` |
   | `DATABASE_URL` | ❌ | Postgres (e.g. Neon) for anonymous usage statistics. Disabled if unset. | None |
   | `USAGE_SALT` | ❌ | Secret (≥16 chars) used to hash users for statistics. Required with `DATABASE_URL`. | None |
   | `STATS_KEY` | ❌ | Access key for `GET /stats.json?key=…` (≥16 chars). | None |

4. Deploy. Your addon will be available at `https://<your-project>.vercel.app`:
   * Web Configurator: `https://<your-project>.vercel.app/configure`
   * Manifest: `https://<your-project>.vercel.app/manifest.json`
   * Health Check: `https://<your-project>.vercel.app/health`

### Option B: Using Vercel CLI
```bash
npm i -g vercel
vercel                         # Link project and preview
vercel --prod                  # Deploy to production
```

---

## 🐳 Self-Hosting with Docker

```bash
# Docker Compose
docker compose up -d --build

# Docker CLI
docker build -t stremio-tmdb-year-catalog .
docker run -d --name stremio-tmdb-year-catalog -p 7000:7000 \
  -e TMDB_API_KEY=your_key \
  -e PUBLIC_URL=https://catalog.yourdomain.com \
  stremio-tmdb-year-catalog
```

Place the container behind a reverse proxy (Caddy, Nginx, Traefik, or Cloudflare) with HTTPS. The container includes a built-in `HEALTHCHECK` querying `/health`.

---

## 🛠️ Local Development

### Prerequisites
* Node.js **>= 22** and npm.

### Setup
```bash
git clone https://github.com/pinavetas/tmdb-year-catalog-addon.git
cd tmdb-year-catalog-addon
npm install
cp .env.example .env   # configure your TMDB_API_KEY
```

### Commands
```bash
npm run dev               # Development server with hot reload (http://localhost:7000)
npm run typecheck         # Full TypeScript typecheck (code & tests)
npm run build             # Compile TypeScript to dist/
npm start                 # Start compiled production server
npm test                  # Run complete test suite (unit + mocks)
npm run test:unit         # Run mock tests without network calls
npm run test:integration  # Run integration tests against TMDB API
```

On Windows PowerShell, use `npm.cmd` if execution policies prevent running `.ps1` scripts.

Open in your browser:
* Configurator: `http://localhost:7000/configure`
* Manifest: `http://localhost:7000/manifest.json`

---

## 🔌 API Endpoints

| Route | Description |
| :--- | :--- |
| `GET /` | Redirects directly to `/configure` |
| `GET /configure`, `GET /:config/configure` | Addon configuration web UI (pre-filled when `:config` is present) |
| `GET /manifest.json`, `GET /:config/manifest.json` | Stremio v3 Manifest |
| `GET /catalog/:type/:id[/:extra].json` | Catalog queries (also accepts `/:config` prefix) |
| `GET /logo.png` | Addon 256×256 PNG logo |
| `GET /health` | Service health status and version info |
| `GET /stats.json?key=…` | Aggregated anonymous usage statistics (only when `STATS_KEY` and `DATABASE_URL` are set) |

> `:config` is a URL-safe Base64URL string containing JSON user preferences. If a user enters their personal TMDB API key, it travels encoded in the URL as required by the Stremio Addon Protocol.

---

## 📂 Project Structure

```text
tmdb-year-catalog-addon/
├── docs/                       # Architecture documentation
│   └── ARCHITECTURE.md
├── scripts/
│   ├── generate-logo.mjs       # Generates standalone 256x256 PNG logo module
│   └── publish-stremio.mjs     # Publishes manifest to Stremio central registry
├── src/
│   ├── app.ts                  # Hono application (default export for Vercel)
│   ├── node.ts                 # Standalone Node.js server (dev, Docker, VPS)
│   ├── config.ts               # Environment variables, TTLs, and dropdown options
│   ├── assets/logo.ts          # Embedded PNG logo in Base64
│   ├── routes/                 # manifest, catalog, configure
│   ├── services/               # tmdbClient, cacheService, queryParser
│   ├── types/                  # Stremio Protocol v3, TMDB, and user config types
│   └── views/configurePage.ts  # Bilingual configuration HTML & client script
├── tests/                      # Test suite (node:test + tsx)
├── vercel.json / .vercelignore # Vercel deployment configuration
├── Dockerfile / docker-compose.yml
└── package.json
```

---

## 🔒 Privacy & Anonymous Usage Statistics

The public instance counts **how many distinct users use the addon per day and from which app**, nothing else:

* Stored per day: an HMAC-SHA256 hash of the user's TMDB key (keyed with a server secret, irreversible), the date, and the client app name taken from the User-Agent (e.g. `nuvio`).
* **Never stored:** API keys, IP addresses, configuration, search terms or watched titles.
* Request logs strip the configuration segment of URLs, which carries the user's keys.

Self-hosted instances have statistics **disabled** unless `DATABASE_URL` and `USAGE_SALT` are set.

---

## 📄 License & Attribution

This project is licensed under the **MIT License** — see the [`LICENSE`](LICENSE) file for details.

This product uses the TMDB API but is not endorsed or certified by [TMDB](https://www.themoviedb.org). All content metadata is provided by The Movie Database.
