# Plan de Desarrollo - IMDb & Year Filter Catalog Addon

Este documento detalla las fases de construcción, hitos de entrega, refinamientos realizados y hoja de ruta futura.

---

## Estado Actual de las Fases

| Fase | Descripción | Estado |
| :--- | :--- | :---: |
| **Fase 1** | Andamiaje TypeScript, tipos de Stremio v3 y servidor Hono |  **Completada** |
| **Fase 2** | Cliente TMDB, caché LRU de alto rendimiento y parser de búsqueda |  **Completada** |
| **Fase 3** | Rutas de catálogo dinámicas, paginación (`skip`) y filtrado estricto |  **Completada** |
| **Fase 4** | Página visual interactiva `/configure` con manifiesto dinámico Base64 |  **Completada** |
| **Fase 5** | Empaquetado Docker multietapa, suite de tests y documentación comunitaria |  **Completada** |
| **Refinamiento UI** | Reorganización en catálogos específicos (Países, Años, Notas) y delegación limpia a Cinemeta |  **Completada** |

---

## Hitos Completados

### Fase 1: Andamiaje y Servidor Hono
* Estructura TypeScript con modo `NodeNext` / `ES2022`.
* Tipos estrictos de Stremio Protocol v3 (`src/types/stremio.ts`).
* Aplicación Hono desacoplada (`src/app.ts`) con CORS universal y listener independiente (`src/index.ts`).

### Fase 2: TMDB y Capa de Rendimiento
* Conexión con TMDB Discover API (`/discover/movie`, `/discover/tv`).
* Doble capa de caché en memoria con `lru-cache`:
  * Catálogos (TTL 6 horas).
  * Mapeo inmutable `tmdb_id` ➔ `imdb_id` (TTL 7 días).
* Mapeo estricto a IMDb IDs (`tt...`) para compatibilidad universal con reproductores.

### Fase 3: Rutas de Catálogo y Pruebas Reales
* Soporte para `GET /catalog/:type/:id/:extra?.json` y `GET /:config/catalog/...`.
* Paginación continua con `skip=20`, `skip=40`, etc.
* Filtrado por fecha (`primary_release_date.lte`) para evitar títulos no estrenados sin fuentes.

### Fase 4: Personalización e Instalación (`/configure`)
* Interfaz web responsiva en modo oscuro (`src/views/configure.html`).
* Generador de instalación automática `stremio://...` y copia de enlaces Base64 para Nuvio.
* Posibilidad de añadir presets o ajustar umbrales de votos mínimos.

### Fase 5 & Refinamiento: Docker y Separación por Países
* Creación de `Dockerfile` multietapa (<50MB) y `docker-compose.yml`.
* **Mejora de UX en Stremio:** Separación en 3 catálogos independientes por tipo:
  * 🌍 **Películas/Series por País:** Desplegable con 15 países con bandera (España, EE.UU., Japón, Corea, etc.).
  * 📅 **Películas/Series por Año:** Desplegable exclusivo de años y épocas.
  * ⭐ **Películas/Series por Nota:** Desplegable exclusivo de notas IMDb.
* **Resolución de apertura:** Retirado `idPrefixes` del root manifest para permitir que Cinemeta abra las fichas de detalle sin interferencias.
* Suite de **23 tests automatizados** pasando al 100%.

---

## Hoja de Ruta Futura (Pendiente)

1. **Internacionalización (i18n):**
   * Traducir la página `/configure` y los nombres de catálogos a inglés para máxima adopción internacional.
2. **Publicación Comunitaria:**
   * Despliegue en plataforma en la nube (Render, Koyeb, Docker VPS con SSL).
   * Envío del manifiesto al registro comunitario de Stremio (`stremio-addons`).
   * Presentación en la comunidad de Reddit (`r/StremioAddons`).
