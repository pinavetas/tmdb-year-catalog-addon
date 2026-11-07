# CLAUDE.md - Stremio IMDb & Year Filter Catalog Addon

## 1. Visión General del Proyecto
**IMDb & Year Filter Catalog Addon** es un plugin (Addon) para **Stremio**, **Nuvio** y **Alder** que implementa directamente la especificación del **Stremio Addon Protocol v3**. Su objetivo principal es resolver la carencia histórica en Stremio de un buscador y explorador avanzado organizado por **país de origen**, **puntuación (IMDb/TMDB)** y **año o época de estreno**, tanto para películas (`movie`) como para series (`series`).

Al tratarse de un addon de catálogo puro (`resource: catalog`), no sirve streams de vídeo directamente; en su lugar, devuelve fichas normalizadas con identificadores de IMDb (`tt...`), lo que permite que cualquier addon de reproducción instalado por el usuario (Torrentio, Comet, FrameXTV, Debrid, etc.) resuelva y reproduzca los contenidos de forma transparente.

---

## 2. Compatibilidad Universal
Este addon es 100% agnóstico del cliente y ha sido diseñado para funcionar de forma nativa en:
* **Stremio Oficial:** Desktop (Windows, macOS, Linux), Android (Móvil y TV), Web y Samsung/LG Smart TVs.
* **[Nuvio](https://nuvio.tv) / NuvioMobile:** En `Settings ➔ Addons` mediante URL del manifiesto.
* **[Alder](https://github.com/aradhyas8/Alder):** Sincronizado automáticamente a través de la cuenta de Stremio.

---

## 3. Stack Tecnológico

| Componente | Tecnología | Justificación |
| :--- | :--- | :--- |
| **Runtime** | Node.js (>= 22) | Estabilidad, compatibilidad y excelente ecosistema. |
| **Despliegue** | Vercel (Hono zero-config) · Node · Docker | `src/app.ts` exporta la app por defecto para Vercel; `src/node.ts` es el servidor standalone. |
| **Lenguaje** | TypeScript | Tipado estricto para modelos de Stremio y respuestas de TMDB. |
| **Framework HTTP** | [Hono](https://hono.dev/) (`@hono/node-server`) | Ultra rápido, sin dependencias pesadas, despliegue universal (Node, Docker, Cloudflare Workers, Vercel). |
| **Protocolo** | Stremio Protocol v3 Nativo | Implementación directa de endpoints REST/JSON sin abstracciones obsoletas del SDK tradicional. |
| **Fuente de Datos** | TheMovieDB (TMDB) API v3 | Endpoint `/discover` altamente optimizado para filtros de nota, votos y años. |
| **Capa de Caché** | `lru-cache` en memoria + `s-maxage` (CDN de Vercel) | Respuestas en <5ms y prevención de saturación de cuotas de TMDB. |
| **Mapeador de IDs** | Mapeo TMDB ID ➔ IMDb ID (`tt...`) | Garantiza compatibilidad absoluta con todos los addons de reproducción. |

---

## 4. Estructura y Distribución del Código

```text
imdb-year-catalog-addon/
├── docs/                      # Documentación detallada del proyecto
│   ├── ARQUITECTURA.md        # Diseño de componentes y especificación de endpoints
│   └── PLAN_DE_DESARROLLO.md  # Fases, hitos y plan de pruebas
├── scripts/
│   ├── generate-logo.mjs      # Regenera src/assets/logo.ts (PNG 256x256)
│   └── publish-stremio.mjs    # Publica el manifiesto en el catálogo de Stremio
├── src/
│   ├── app.ts                 # App Hono + rutas (export default = entrypoint de Vercel)
│   ├── node.ts                # Servidor Node standalone (dev, Docker, VPS)
│   ├── config.ts              # Variables de entorno, TTLs y opciones de desplegables
│   ├── assets/logo.ts         # Logo PNG en base64 (generado, no editar)
│   ├── types/
│   │   ├── stremio.ts         # Tipos oficiales de Stremio Protocol v3
│   │   ├── tmdb.ts            # Tipos de la API de TheMovieDB
│   │   └── config.ts          # Configuración de usuario (Base64URL) y validación
│   ├── services/
│   │   ├── tmdbClient.ts      # Cliente TMDB: bloques de 100, reintentos, mapeo IMDb
│   │   ├── cacheService.ts    # Caché LRU en dos niveles (catálogos y mapeo de IDs)
│   │   └── queryParser.ts     # Parser del segmento extra y búsqueda natural ("2023 8+")
│   ├── routes/
│   │   ├── manifest.ts        # Manifiesto + registro CATALOG_SPECS + ADDON_VERSION
│   │   ├── catalog.ts         # GET /[:config/]catalog/:type/:id/:extra?.json
│   │   └── configure.ts       # GET /[:config/]configure
│   └── views/
│       └── configurePage.ts   # HTML de la página de configuración (módulo TS)
├── tests/                     # node:test + tsx (unitarios con TMDB simulado e integración)
├── vercel.json / .vercelignore
├── Dockerfile / docker-compose.yml
├── .env.example
├── package.json
├── tsconfig.json / tsconfig.test.json
└── README.md
```

---

## 5. Comandos de Desarrollo

```bash
# Instalación de dependencias (en Windows PowerShell usar npm.cmd)
npm.cmd install

# Modo desarrollo con recarga en caliente (servidor Node, puerto 7000)
npm.cmd run dev

# Comprobación de tipos (src + tests)
npm.cmd run typecheck

# Compilación TypeScript a dist/ (Node/Docker; Vercel no la necesita)
npm.cmd run build

# Ejecución en producción (Node)
npm.cmd start

# Tests: todos / unitarios (sin red) / integración (TMDB real, requiere TMDB_API_KEY)
npm.cmd test
npm.cmd run test:unit
npm.cmd run test:integration

# Despliegue en Vercel y publicación en el catálogo de Stremio
vercel --prod
npm.cmd run publish:stremio -- https://<dominio>/manifest.json
```

---

## 6. Convenciones y Buenas Prácticas
1. **Sin dependencias innecesarias:** Mantener el proyecto ligero y modular.
2. **CORS universal:** Todas las respuestas de rutas JSON deben incluir cabeceras CORS (`Access-Control-Allow-Origin: *`).
3. **Manejo defensivo de IDs:** Cada elemento devuelto en el catálogo debe disponer preferentemente de un IMDb ID (`tt...`) válido para asegurar la interoperabilidad con los addons de streaming.
4. **Respeto a las cuotas de API:** Ninguna petición idéntica debe alcanzar a TMDB dos veces consecutivas en una ventana de caché válida. Los errores de TMDB nunca se cachean.
5. **Sin acceso a disco en runtime:** HTML, imágenes y demás recursos se empaquetan como módulos TS para que el bundle de Vercel sea autocontenido.
6. **Registro único de catálogos:** todo catálogo nuevo se añade a `CATALOG_SPECS` (`src/routes/manifest.ts`) y se incrementa `ADDON_VERSION` al cambiar el manifiesto.
7. **Paginación Stremio:** bloques de 100 títulos; stremio-core envía `skip` = nº de títulos ya recibidos.
