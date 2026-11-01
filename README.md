# ⭐ Stremio IMDb & Year Filter Catalog Addon

> Addon de catálogo para **Stremio**, **Nuvio** y **Alder** que permite explorar y buscar películas y series combinando **puntuación mínima (IMDb/TMDB)** y **año o década de estreno**.

[![Stremio Addon Protocol v3](https://img.shields.io/badge/Stremio_Protocol-v3-blue.svg)](https://github.com/Stremio/stremio-addon-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Framework-Hono-orange.svg)](https://hono.dev/)
[![Tests](https://img.shields.io/badge/Tests-21%20Passing-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Características Principales

* **Catálogos por País de Origen:** Explora las mejores producciones de cinematografías mundiales (`🇪🇸 España`, `🇺🇸 EE.UU.`, `🇬🇧 Reino Unido`, `🇯🇵 Japón`, `🇰🇷 Corea del Sur`, `🇫🇷 Francia`, `🇮🇹 Italia`, `🇦🇷 Argentina`, `🇲🇽 México`, etc.).
* **Filtros por Calificación:** Explora títulos con notas mínimas (`⭐ IMDb 8.5+`, `⭐ IMDb 8.0+`, `⭐ IMDb 7.5+`, `⭐ IMDb 7.0+`).
* **Filtros por Año y Época:** Descubre contenidos por año exacto (`📅 2026`, `📅 2025`, `📅 2024`...) o por épocas (`📅 Años 90`, `📅 Años 80`, `📅 Clásicos <1980`).
* **Búsqueda Inteligente en Lenguaje Natural:** Escribe directamente en el buscador de Stremio consultas combinadas como:
  * `2023 8+` *(año 2023 con nota ≥ 8.0)*
  * `dune 2024` *(búsqueda por título y año)*
  * `year:2021 rating:7.5` *(filtros explícitos)*
* **Página de Configuración Interactiva (`/configure`):** Personaliza qué carruseles quieres ver en tu pantalla de inicio, ajusta el filtro de votos mínimos o añade tu propia clave de TMDB.
* **Mapeo Automático a IMDb ID (`tt...`):** Convierte de forma transparente los identificadores de TMDB a IMDb IDs para que cualquier addon de reproducción instalado (Torrentio, Comet, FrameXTV, Debrid, etc.) encuentre los enlaces de vídeo sin problemas.
* **Caché de Alto Rendimiento:** Doble capa de caché LRU en memoria con respuestas instantáneas (`<5ms`) y cabeceras HTTP `Cache-Control`.

---

## 📱 Compatibilidad Universal

| Cliente | Plataforma | Cómo se instala |
| :--- | :--- | :--- |
| **Stremio Oficial** | Windows, macOS, Linux, Android (Móvil y TV), Samsung/LG TV | Abre la página `/configure` y pulsa **"Instalar en Stremio"**, o pega la URL del manifiesto en el buscador de Addons. |
| **[Nuvio](https://nuvio.tv) / NuvioMobile** | Android, iOS, Tablets, Desktop | Ve a `Ajustes ➔ Addons ➔ Añadir Addon por URL` y pega el enlace del manifiesto. |
| **[Alder](https://github.com/aradhyas8/Alder)** | Android TV | Se sincroniza automáticamente con tu cuenta de Stremio una vez instalado. |

---

## 🛠️ Instalación y Uso Rápido (Local)

### Requisitos Previos
* Node.js (>= 20 LTS) y npm.

### 1. Clonar e Instalar Dependencias
```bash
git clone https://github.com/tu-usuario/imdb-year-catalog-addon.git
cd imdb-year-catalog-addon
npm install
```

### 2. Configurar Variables de Entorno (Opcional)
El addon incluye una clave comunitaria preconfigurada para funcionar de inmediato. Si deseas usar tu propia clave de TMDB:
```bash
cp .env.example .env
```
Edita `.env` con tus preferencias:
```env
PORT=7000
HOST=0.0.0.0
TMDB_API_KEY=tu_clave_de_32_caracteres_aqui
DEFAULT_MIN_VOTES_MOVIE=200
DEFAULT_MIN_VOTES_SERIES=50
```

### 3. Ejecutar en Modo Desarrollo
```bash
npm run dev
```
Abre en tu navegador:
* **Página de Configuración:** `http://localhost:7000/configure`
* **Manifiesto de Stremio:** `http://localhost:7000/manifest.json`

---

## 🐳 Despliegue con Docker

### Opción A: Con Docker Compose (Recomendada)
```bash
docker compose up -d --build
```

### Opción B: Con Docker CLI
```bash
# Construir la imagen
docker build -t stremio-imdb-year-catalog .

# Ejecutar el contenedor
docker run -d \
  --name stremio-imdb-year-catalog \
  -p 7000:7000 \
  -e TMDB_API_KEY=tu_clave_aqui \
  stremio-imdb-year-catalog
```

---

## ☁️ Despliegue Gratuito en la Nube

Puedes alojar este addon de forma gratuita o de muy bajo coste en plataformas como:

1. **[Render](https://render.com) / [Koyeb](https://koyeb.com):**
   * Conecta tu repositorio de GitHub.
   * Selecciona entorno **Node** o **Docker**.
   * Define el comando de inicio `npm start` y el puerto `7000`.
2. **VPS con Docker (Hetzner, OVH, Oracle Cloud Free Tier):**
   * Clona el repositorio y ejecuta `docker compose up -d`.
   * Configura un proxy inverso con Caddy o Nginx para tener SSL (`https://`).

---

## 🧪 Pruebas Unitarias y de Integración

El proyecto cuenta con una suite completa de tests automatizados que simulan peticiones reales del protocolo Stremio v3:

```bash
npm test
```

### Cobertura de Tests:
* ✔ Manifiesto estándar y dinámico (`getManifest`).
* ✔ Respuestas HTTP y cabeceras CORS (`/manifest.json`, `/`).
* ✔ Parser de consultas por lenguaje natural y filtros (`QueryParser`).
* ✔ Doble caché en memoria para catálogos e IMDb IDs (`CacheService`).
* ✔ Cliente TMDB Discover con resolución de IMDb IDs (`TmdbClient`).
* ✔ Paginación con `skip` y búsqueda combinada (`/catalog/...`).
* ✔ Página de configuración y serialización Base64 (`/configure`).

---

## 📂 Estructura del Código

```text
imdb-year-catalog-addon/
├── docs/                      # Documentación de arquitectura y planes
│   ├── ARQUITECTURA.md
│   └── PLAN_DE_DESARROLLO.md
├── src/
│   ├── app.ts                 # Aplicación Hono desacoplada con middlewares
│   ├── index.ts               # Listener HTTP del servidor
│   ├── config.ts              # Variables de entorno y constantes
│   ├── types/
│   │   ├── stremio.ts         # Tipos oficiales de Stremio Protocol v3
│   │   ├── tmdb.ts            # Tipos de respuesta de TheMovieDB
│   │   └── config.ts          # Tipos y codificador Base64 de ajustes
│   ├── services/
│   │   ├── tmdbClient.ts      # Cliente HTTP para TMDB con reintentos
│   │   ├── cacheService.ts    # Capa de caché LRU
│   │   └── queryParser.ts     # Analizador de sintaxis y búsqueda
│   ├── routes/
│   │   ├── manifest.ts        # GET /manifest.json y GET /:config/manifest.json
│   │   ├── catalog.ts         # GET /catalog/:type/:id/:extra?.json
│   │   └── configure.ts       # GET /configure
│   └── views/
│       └── configure.html     # Interfaz web de configuración
├── tests/                     # Suite de pruebas automatizadas
├── Dockerfile                 # Contenedor multietapa ultra ligero
├── docker-compose.yml         # Despliegue con un clic
├── CLAUDE.md                  # Referencia rápida de desarrollo
└── package.json
```

---

## 📄 Licencia

Distribuido bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.
