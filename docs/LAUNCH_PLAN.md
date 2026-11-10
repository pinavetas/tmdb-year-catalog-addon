# 🚀 Launch & Promotion Action Plan

This document outlines the step-by-step checklist to take **TMDB Year, Country & Rating Catalog** public, register it in the official Stremio community registries, and promote it on Reddit (`r/StremioAddons`).

---

## 📋 Phase 1: Make GitHub Repository Public

Before registering in public directories or sharing on Reddit, ensure the GitHub repository is publicly accessible:

1. Open your repository settings: [github.com/pinavetas/tmdb-year-catalog-addon/settings](https://github.com/pinavetas/tmdb-year-catalog-addon/settings)
2. Scroll to the **"Danger Zone"** at the bottom of the General tab.
3. Under **"Change repository visibility"**, select **"Make public"**.
4. Confirm the confirmation prompt.
5. In **About** (top-right of repository homepage):
   - **Description:** `A modern, lightweight Stremio catalog addon to browse movies and series by release year/decade, origin region, and TMDB rating, with smart search and optional RPDB poster badges.`
   - **Website:** `https://tmdb-year-catalog-addon.vercel.app/configure`
   - **Topics/Tags:** `stremio`, `stremio-addon`, `tmdb`, `movies`, `series`, `ratings`, `typescript`, `hono`, `rpdb`

---

## 🌐 Phase 2: Register in Official Stremio Directories

### Registry 1: Stremio-Addons.net (Primary Community Directory)
This is the modern community catalog database consulted by Stremio, Nuvio, and community addon managers.

1. Navigate to [stremio-addons.net](https://stremio-addons.net/).
2. Click **Login** and authenticate with your Stremio account.
3. Click **"Submit Addon"**.
4. Fill in the submission form:
   - **Addon Name:** `TMDB Catalog: Year, Country & Rating`
   - **Manifest URL:** `https://tmdb-year-catalog-addon.vercel.app/manifest.json` *(Important: Submit the bare URL without any `:config` prefix or personal keys)*.
   - **Author:** `pinavetas`
   - **Icon URL:** `https://tmdb-year-catalog-addon.vercel.app/logo.png`
   - **Short Description:**
     ```text
     Explore top movies and series by origin region (Europe, Spain, Hollywood, Latin America, Asia), release year/decade, and TMDB user rating. Features natural language search ("2023 8+", "dune 2024"), official genre badges, and optional RPDB posters. Compatible with Stremio, Nuvio, and Alder.
     ```
5. Click **Submit**. The system runs an automated manifest health-check and indexes the addon.

---

### Registry 2: Stremio Central API (`publishToCentral`)
This registers your addon in Stremio's legacy central directory API (`api.strem.io/api/addonPublish`).

Run the automated publisher script from the project root:

```bash
npm.cmd run publish:stremio -- https://tmdb-year-catalog-addon.vercel.app/manifest.json
```

Verify that the output returns `Published TMDB Catalog: Year, Country & Rating v1.1.0: ok`.

---

## 📢 Phase 3: Launch on Reddit (`r/StremioAddons`)

### Timing & Recommendations
* **Best Days:** Tuesday or Wednesday.
* **Best Time:** 14:00 - 16:00 UTC (morning in the Americas, afternoon in Europe).
* **Flair:** `Addon` (or `Developer`).

### Post Title
```text
[NEW ADDON] TMDB Year, Country & Rating Catalog – Discover Movies & Series by Region, Eras, TMDB Scores & RPDB Posters
```

### Post Body (Markdown)
```markdown
Hey everyone! 👋

I've developed a new open-source catalog addon for **Stremio**, **Nuvio**, and **Alder**: **TMDB Year, Country & Rating Catalog**.

Most default catalogs sort by generic popularity without letting you explore by specific origin countries, eras, or authentic TMDB ratings. This addon solves that while keeping Stremio's UI native and clutter-free.

### 🌟 Key Features
* 🎬 **Clean Native Discover UI:** No intrusive emojis or duplicate badges. Catalogs show up cleanly as `Top Movies` and `Top Series`.
* 📅 **Explore by Year & Decade:** Browse individual release years (from current year down to 2020) and grouped eras (`2015-2019`, `2000s`, `90s`, `80s`, `70s`, `Classics (<1970)`).
* 🌍 **Production Regions:** Filter by 🇪🇺 Europe, 🇪🇸 Spain, 🇺🇸 Hollywood / USA, 🌎 Latin America, 🌏 Asia, or worldwide.
* ⭐ **TMDB Score Thresholds:** Set your minimum rating cutoff (e.g. `7.5+`, `8.0+ Great`, etc.). Cards cleanly show release year and score (e.g. `2024 · TMDB 8.2`) without misleading IMDb logo overlays.
* 🎨 **Optional RPDB Poster Badges:** Direct integration with [RatingPosterDB (RPDB)](https://ratingposterdb.com/) if you want sleek rating tiers stamped right onto the poster artwork.
* 🏷️ **Official TMDB Genre Badges:** Title cards automatically show real genre badges (Action, Drama, Sci-Fi...).
* 🔎 **Natural Language Search:** Type queries like `2023 8+`, `dune 2024`, `year:2021 rating:7.5`, or `>7.5 horror` right into Stremio's search bar.
* ⚡ **100% Stream Addon Compatibility:** Every title resolves to an IMDb ID (`tt...`), so it pairs instantly with Torrentio, Comet, Debrid, and player scrapers.
* 🌐 **Bilingual (English & Spanish):** Toggle metadata language in the configurator.

---

### 🚀 How to Install

1. Open the Web Configurator: **https://tmdb-year-catalog-addon.vercel.app/configure**
2. Paste your free TMDB API Key (step-by-step 2-minute guide included right on the page).
3. *(Optional)* Add your RPDB key and customize your rating cutoff and origin countries.
4. Click **«Install in Stremio»** (or copy the manifest URL into Nuvio / Alder).

---

### 💻 Open Source & Self-Hosting
The project is 100% open source under the MIT license:
* **GitHub:** https://github.com/pinavetas/tmdb-year-catalog-addon
* Built with TypeScript + Hono. Includes zero-config Vercel deployment, Docker Compose, and a local Node.js server.

Feedback and suggestions are very welcome! Hope you find it useful for discovering hidden gems and great classics!
```

---

## 📊 Phase 4: Monitoring & Traffic Scaling

1. **Vercel Analytics & Usage:**
   - Check [vercel.com/dashboard](https://vercel.com/dashboard) ➔ `tmdb-year-catalog-addon` ➔ **Usage**.
   - Monitor **Edge Requests** and **Function Invocations** (Hobby free tier covers 100k invocations/month and 100 GB edge bandwidth).
2. **If Traffic Scales Beyond Hobby Free Tier:**
   - **Zero-Cost Scaling:** Spin up an **Oracle Cloud Always Free VM** (4 OCPU ARM, 24 GB RAM free forever) or a cheap VPS (Hetzner ~€3.5/mo) and run `docker compose up -d` with Caddy/Nginx.
   - **Vercel Pro:** $20/month if you prefer managed serverless with 1M invocations.
