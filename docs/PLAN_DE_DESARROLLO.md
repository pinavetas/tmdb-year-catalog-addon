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
| **Fase 6** | Adaptación a Vercel, conformidad con el protocolo Stremio y endurecimiento para producción |  **Completada** |

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
* Suite de tests automatizados pasando al 100%.

---

### Fase 6: Vercel y Conformidad con el Protocolo (v1.1.0)
* **Vercel zero-config:** `src/app.ts` exporta la app Hono por defecto; el servidor Node pasa a `src/node.ts`. `vercel.json` (verificación de tipos en el build) y `.vercelignore` (excluye `.env`).
* **Sin lecturas de disco:** la página de configuración y el logo se empaquetan como módulos TS.
* **Paginación conforme a stremio-core:** bloques de 100 títulos y `skip` = títulos recibidos (antes se repetían páginas cuando se descartaba algún título sin IMDb ID).
* **Ruta `/:config/configure`:** el botón *Configurar* de Stremio en addons ya configurados daba 404; ahora abre la página con la configuración precargada.
* **Logo PNG 256×256** (`/logo.png`) en lugar de SVG; eliminado el `background` que apuntaba a un recurso inexistente.
* **Búsqueda en catálogos dedicados** (`search` obligatorio) para evitar 6 filas duplicadas en el buscador.
* **Parser de `extra` sobre la ruta cruda:** las búsquedas con `&` (`%26`) ya no se cortan.
* **Caché:** los errores de TMDB ya no se cachean 6 horas como listas vacías; cabeceras `s-maxage`/`stale-while-revalidate` para la CDN y `cacheMaxAge` para Stremio.
* **TMDB:** OR nativo de países (`SE|NO|DK|FI`), límite de fecha a hoy también con filtro de año, reintentos ante 5xx, concurrencia limitada, soporte de token v4.
* **Configuración:** `DEFAULT_MIN_VOTES_*` del servidor ahora sí se aplica (antes lo anulaba el valor por defecto del usuario); años del desplegable generados dinámicamente.
* Tests unitarios con TMDB simulado (sin red) además de los de integración.

---

## Hoja de Ruta Futura (Pendiente)

1. **Internacionalización (i18n):**
   * Traducir la página `/configure` y los nombres de catálogos a inglés, y exponer `TMDB_LANGUAGE` como opción de usuario.
2. **Publicación Comunitaria:**
   * Desplegar en Vercel y ejecutar `npm run publish:stremio -- https://<dominio>/manifest.json`.
   * Presentación en la comunidad de Reddit (`r/StremioAddons`).
3. **Caché compartida opcional:**
   * Backend Redis/Upstash para compartir el mapeo de IMDb IDs entre instancias serverless.
