# ⭐ TMDB Year, Country & Rating · Stremio Catalog Addon

> Addon de catálogo para **Stremio**, **Nuvio** y **Alder** que permite explorar y buscar películas y series por **país de origen**, **año o época de estreno** y **puntuación de TMDB**, con soporte multidioma (inglés y español) y búsqueda en lenguaje natural.

[![Stremio Addon Protocol v3](https://img.shields.io/badge/Stremio_Protocol-v3-blue.svg)](https://github.com/Stremio/stremio-addon-sdk/tree/master/docs/protocol.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Framework-Hono-orange.svg)](https://hono.dev/)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg)](#️-despliegue-en-vercel-recomendado)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🚀 Características

* **🎬 Catálogos limpios (Top Movies / Mejores Películas):** Sin saturar el inicio de Stremio, con integración nativa en los menús desplegables sin emojis.
* **🌐 Soporte bilingüe completo:** Configurable en inglés y español. Las consultas a TMDB obtienen títulos, sinopsis y fechas en el idioma elegido.
* **📅 Exploración por año o época:** Selector desplegable con años individuales (desde 2020 hasta el año en curso) y décadas/rangos (`2015 - 2019`, `2000s`, `90s`, `Classics <1970`).
* **🌍 Filtro por regiones de origen:** 🇪🇺 Europa, 🇪🇸 España, 🇺🇸 Estados Unidos / Hollywood, 🌎 Latinoamérica, 🌏 Asia o producciones de todo el mundo.
* **⭐ Puntuación TMDB:** Define tu umbral mínimo de corte (`7.0+ Notable`, `7.5+`, `8.0+ Sobresaliente` u `8.5+ Obras Maestras`). Cada carátula muestra la nota y año de estreno (`2024 · TMDB 8.2`).
* **🔎 Búsqueda inteligente:**
  * `2023 8+` → títulos de 2023 con nota ≥ 8.0
  * `dune 2024` → búsqueda por título y año
  * `year:2021 rating:7.5` → filtros explícitos
  * `>7.5 horror` / `>7.5 terror` → título con nota mínima
* **IMDb IDs (`tt…`) garantizados:** Cada título se mapea de TMDB a IMDb, garantizando compatibilidad con cualquier addon de streams (Torrentio, Comet, Debrid…) y reproductores.
* **Paginación nativa de Stremio:** bloques de 100 títulos con `skip`, compatible con scroll infinito en Stremio y Nuvio.
* **Página de configuración** ([/configure](https://tmdb-year-catalog-addon.vercel.app/configure)): selector de idioma, clave TMDB con guía interactiva, selección de regiones, nota de corte y votos mínimos.

---

## 📱 Compatibilidad

| Cliente | Plataforma | Instalación |
| :--- | :--- | :--- |
| **Stremio** | Windows, macOS, Linux, Android (móvil y TV), Web, Smart TV | Abre `/configure` y pulsa **Instalar en Stremio** (o **Instalar en Stremio Web**). También puedes pegar la URL del manifiesto en el buscador de addons. |
| **[Nuvio](https://nuvio.tv)** | Android, iOS, tablets | `Ajustes ➔ Addons ➔ Añadir addon` y pega la URL del manifiesto (botón **Copiar URL** de `/configure`). |
| **[Alder](https://github.com/aradhyas8/Alder)** | Android TV | Se sincroniza con tu cuenta de Stremio una vez instalado. |

---

## ☁️ Despliegue en Vercel (recomendado)

El proyecto está preparado para el soporte *zero-config* de Hono en Vercel: `src/app.ts` exporta la aplicación por defecto y Vercel la convierte en una Vercel Function (Fluid compute).

### Opción A: desde GitHub (recomendada)
1. Sube el repositorio a GitHub.
2. En [vercel.com/new](https://vercel.com/new) importa el repositorio. Vercel detecta **Hono** automáticamente; no cambies los comandos (el `vercel.json` ejecuta un `tsc --noEmit` como verificación).
3. En **Settings ➔ Environment Variables** añade:

   | Variable | Obligatoria | Valor |
   | :--- | :---: | :--- |
   | `TMDB_API_KEY` | ✅ | Tu clave v3 o token v4 de [TMDB](https://www.themoviedb.org/settings/api) |
   | `PUBLIC_URL` | ❌ | Solo si usas dominio propio y quieres fijarlo (ej. `https://addon.midominio.com`). Si no, se deduce de la petición. |
   | `DEFAULT_MIN_VOTES_MOVIE` | ❌ | Por defecto `200` |
   | `DEFAULT_MIN_VOTES_SERIES` | ❌ | Por defecto `50` |
   | `TMDB_LANGUAGE` | ❌ | Por defecto `es-ES` |

4. Despliega. Tu addon quedará en `https://<proyecto>.vercel.app`:
   * Configuración: `https://<proyecto>.vercel.app/configure`
   * Manifiesto: `https://<proyecto>.vercel.app/manifest.json`
   * Healthcheck: `https://<proyecto>.vercel.app/health`

### Opción B: con Vercel CLI
```bash
npm i -g vercel
vercel                         # primer despliegue (preview) y vinculación del proyecto
vercel env add TMDB_API_KEY    # añade la clave a production/preview
vercel --prod                  # despliegue a producción
```

Para probar localmente con el mismo runtime que en Vercel: `vercel dev`.

> 🔒 `.vercelignore` excluye `.env`, así que tu clave local nunca se sube con `vercel` CLI. Define las variables siempre desde el dashboard o con `vercel env`.

### Dónde alojarlo y cómo no perder a los usuarios

Los usuarios instalan el addon **por su URL**. Si el hosting cae o cambia, esa URL deja de funcionar y cada usuario tiene que reinstalarlo. La medida más eficaz es usar un **dominio propio** (ej. `addon.midominio.com`) apuntando al hosting: así se puede migrar de proveedor sin que nadie reinstale. El código ya funciona en Vercel, Node y Docker.

| Opción | Encaje con este addon |
| :--- | :--- |
| **Vercel Hobby** (recomendada) | ✅ Gratis para uso personal no comercial (se permiten donaciones). 1M invocaciones/mes y caché en CDN. Sin arranques en frío largos. |
| **Docker en VPS** (Hetzner, Oracle Free Tier…) | ✅ Alternativa con control total si Vercel se queda corto. Usa el `Dockerfile` incluido y un proxy con HTTPS. |
| **BeamUp** (hosting recomendado por el SDK de Stremio) | ⚠️ Gratuito y mantenido, pero (a noviembre de 2026) ha tenido caídas largas, solo ofrece Node 22.11 sin parches de seguridad, los addons nuevos con `Dockerfile` no arrancan y la URL queda ligada a `*.baby-beamup.club` (sin dominio propio). Si se usa, hay que definir `PUBLIC_URL`, porque no envía cabeceras `X-Forwarded-*`. |
| **Render Free** | ❌ Se suspende tras 15 min sin tráfico y tarda ~1 min en arrancar. Stremio agotaría el tiempo de espera. |
| **Cloudflare Workers Free** | ❌ Límite de 50 subpeticiones por petición. Un catálogo en frío hace hasta ~105 llamadas a TMDB. |

> Las retiradas de addons suelen afectar a los que **sirven streams o hacen scraping** (DMCA). Este addon solo devuelve metadatos de TMDB con IMDb IDs, con la atribución que exige TMDB. No incluyas anuncios ni pagos si usas Vercel Hobby: eso cuenta como uso comercial.

### Publicar en el catálogo comunitario de Stremio
Una vez desplegado en HTTPS:
```bash
npm run publish:stremio -- https://<proyecto>.vercel.app/manifest.json
```
Usa el mismo endpoint que `publishToCentral` del SDK oficial. El addon aparecerá en la sección *Community Addons* de Stremio.

---

## 🛠️ Desarrollo local

### Requisitos
* Node.js **>= 22** y npm.

### Instalación
```bash
git clone https://github.com/<tu-usuario>/imdb-year-catalog-addon.git
cd imdb-year-catalog-addon
npm install
cp .env.example .env   # y rellena TMDB_API_KEY
```

### Comandos
```bash
npm run dev               # servidor Node con recarga en caliente (http://localhost:7000)
npm run typecheck         # comprobación de tipos (código y tests)
npm run build             # compila a dist/ (para Node/Docker)
npm start                 # ejecuta dist/node.js
npm test                  # todos los tests
npm run test:unit         # tests sin red (TMDB simulado)
npm run test:integration  # tests contra la API real de TMDB (requiere TMDB_API_KEY)
```

En Windows PowerShell usa `npm.cmd` en lugar de `npm` si la política de ejecución bloquea los scripts.

Abre en el navegador:
* Configuración: `http://localhost:7000/configure`
* Manifiesto: `http://localhost:7000/manifest.json`

> Stremio Desktop permite instalar addons por `http://localhost`, pero Stremio Web y los móviles exigen HTTPS: usa el despliegue en Vercel (o un túnel) para probar en esos clientes.

---

## 🐳 Despliegue alternativo con Docker

```bash
# Docker Compose (lee TMDB_API_KEY y PUBLIC_URL del entorno o de .env)
docker compose up -d --build

# Docker CLI
docker build -t stremio-imdb-year-catalog .
docker run -d --name stremio-imdb-year-catalog -p 7000:7000 \
  -e TMDB_API_KEY=tu_clave -e PUBLIC_URL=https://addon.midominio.com \
  stremio-imdb-year-catalog
```

Detrás de un proxy inverso (Caddy, Nginx, Traefik) con HTTPS. La imagen incluye `HEALTHCHECK` sobre `/health`.

---

## 🔌 Endpoints

| Ruta | Descripción |
| :--- | :--- |
| `GET /` | Portada con enlace a la configuración |
| `GET /configure`, `GET /:config/configure` | Página de configuración (precargada si hay `:config`) |
| `GET /manifest.json`, `GET /:config/manifest.json` | Manifiesto Stremio v3 |
| `GET /catalog/:type/:id[/:extra].json` | Catálogo (también con prefijo `/:config`) |
| `GET /logo.png` | Logo PNG 256×256 del addon |
| `GET /health` | Estado del servicio |

`:config` es la configuración del usuario en JSON codificado en Base64URL. **No es cifrado:** si el usuario añade su propia clave de TMDB, esta va dentro de la URL del addon.

---

## 🧪 Tests

* Manifiesto estándar y dinámico, registro de catálogos y opciones de año dinámicas.
* Rutas HTTP: CORS, preflight, logo PNG, healthcheck, 404, escape de HTML.
* Parser de `extra` sobre la ruta cruda (`%26` en búsquedas, `+`, `skip` acotado).
* Cliente TMDB con `fetch` simulado: bloques de 100, mapeo de `skip`, filtros de discover, búsqueda, token v4, caché y errores no cacheados.
* Ruta de catálogo: presets, validación tipo/catálogo, configuración de usuario y cabeceras de caché.
* Integración real con TMDB (se omiten automáticamente si no hay `TMDB_API_KEY`).

---

## 📂 Estructura

```text
imdb-year-catalog-addon/
├── docs/                       # Arquitectura y plan de desarrollo
├── scripts/
│   ├── generate-logo.mjs       # Genera src/assets/logo.ts (PNG 256x256 sin dependencias)
│   └── publish-stremio.mjs     # Publica el manifiesto en el catálogo de Stremio
├── src/
│   ├── app.ts                  # App Hono (export default → entrypoint de Vercel)
│   ├── node.ts                 # Servidor Node standalone (dev, Docker, VPS)
│   ├── config.ts               # Variables de entorno, TTLs y opciones de desplegables
│   ├── assets/logo.ts          # Logo PNG en base64 (generado)
│   ├── routes/                 # manifest, catalog, configure
│   ├── services/               # tmdbClient, cacheService, queryParser
│   ├── types/                  # Tipos Stremio, TMDB y configuración de usuario
│   └── views/configurePage.ts  # HTML de la página de configuración
├── tests/                      # Suite de tests (node:test + tsx)
├── vercel.json / .vercelignore # Configuración de Vercel
├── Dockerfile / docker-compose.yml
└── package.json
```

---

## 📄 Licencia y atribución

Distribuido bajo licencia **MIT** (ver [`LICENSE`](LICENSE)).

Este producto usa la API de TMDB pero no está avalado ni certificado por [TMDB](https://www.themoviedb.org). IMDb es una marca de IMDb.com, Inc.; este proyecto no está afiliado a IMDb.
