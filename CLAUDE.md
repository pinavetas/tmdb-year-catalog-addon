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
| **Runtime** | Node.js (>= 20 LTS) | Estabilidad, compatibilidad y excelente ecosistema. |
| **Lenguaje** | TypeScript | Tipado estricto para modelos de Stremio y respuestas de TMDB. |
| **Framework HTTP** | [Hono](https://hono.dev/) (`@hono/node-server`) | Ultra rápido, sin dependencias pesadas, despliegue universal (Node, Docker, Cloudflare Workers, Vercel). |
| **Protocolo** | Stremio Protocol v3 Nativo | Implementación directa de endpoints REST/JSON sin abstracciones obsoletas del SDK tradicional. |
| **Fuente de Datos** | TheMovieDB (TMDB) API v3 | Endpoint `/discover` altamente optimizado para filtros de nota, votos y años. |
| **Capa de Caché** | `lru-cache` en memoria | Respuestas en <5ms y prevención de saturación de cuotas de TMDB. |
| **Mapeador de IDs** | Mapeo TMDB ID ➔ IMDb ID (`tt...`) | Garantiza compatibilidad absoluta con todos los addons de reproducción. |

---

## 4. Estructura y Distribución del Código

```text
imdb-year-catalog-addon/
├── docs/                      # Documentación detallada del proyecto
│   ├── ARQUITECTURA.md        # Diseño de componentes y especificación de endpoints
│   └── PLAN_DE_DESARROLLO.md  # Fases, hitos y plan de pruebas
├── src/
│   ├── index.ts               # Servidor principal y registro de middlewares
│   ├── config.ts              # Variables de entorno y valores por defecto
│   ├── types/
│   │   ├── stremio.ts         # Tipos oficiales de Stremio Protocol v3
│   │   └── tmdb.ts            # Tipos de la API de TheMovieDB
│   ├── services/
│   │   ├── tmdbClient.ts      # Cliente HTTP para TMDB con reintentos y mapeo
│   │   ├── cacheService.ts    # Caché LRU en dos niveles (catálogos y mapeo de IDs)
│   │   └── queryParser.ts     # Parser inteligente de texto libre (ej. "2023 8+")
│   ├── routes/
│   │   ├── manifest.ts        # GET /manifest.json y GET /:config/manifest.json
│   │   ├── catalog.ts         # GET /catalog/:type/:id/:extra?.json
│   │   └── configure.ts       # GET /configure (página web de configuración)
│   └── views/
│       └── configure.html     # Interfaz web interactiva para personalizar carruseles
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. Comandos de Desarrollo

```bash
# Instalación de dependencias (en Windows PowerShell usar npm.cmd)
npm.cmd install

# Modo desarrollo con recarga en caliente
npm.cmd run dev

# Compilación TypeScript a JavaScript
npm.cmd run build

# Ejecución en producción
npm.cmd start

# Ejecución de tests unitarios
npm.cmd test
```

---

## 6. Convenciones y Buenas Prácticas
1. **Sin dependencias innecesarias:** Mantener el proyecto ligero y modular.
2. **CORS universal:** Todas las respuestas de rutas JSON deben incluir cabeceras CORS (`Access-Control-Allow-Origin: *`).
3. **Manejo defensivo de IDs:** Cada elemento devuelto en el catálogo debe disponer preferentemente de un IMDb ID (`tt...`) válido para asegurar la interoperabilidad con los addons de streaming.
4. **Respeto a las cuotas de API:** Ninguna petición idéntica debe alcanzar a TMDB dos veces consecutivas en una ventana de caché válida.
