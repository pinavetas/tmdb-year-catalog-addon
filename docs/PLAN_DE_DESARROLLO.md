# Plan de Desarrollo Inicial - IMDb & Year Filter Catalog Addon

Este documento detalla las fases de construcción, hitos de entrega y criterios de verificación para el desarrollo del addon de Stremio.

---

## Cronograma por Fases

### Fase 1: Andamiaje, Tipado y Manifiesto Base
* **Objetivo:** Inicializar el entorno TypeScript con Hono y publicar un manifiesto estático válido para el protocolo Stremio v3.
* **Entregables:**
  * `package.json` con scripts de compilación, ejecución y dependencias clave (`hono`, `@hono/node-server`, `lru-cache`, `dotenv`).
  * `tsconfig.json` configurado para target ES2022 / NodeNext.
  * `src/types/stremio.ts` con definiciones de `Manifest`, `Catalog`, `MetaPreview`, `ExtraParam`.
  * Endpoint `GET /manifest.json` operativo con cabeceras CORS activas.
* **Criterio de éxito:** Poder acceder con un navegador o cliente HTTP a `http://localhost:7000/manifest.json` y recibir una estructura válida que Stremio pueda cargar.

---

### Fase 2: Cliente TMDB, Parser de Búsqueda y Capa de Caché
* **Objetivo:** Construir la lógica de obtención de datos y optimización de rendimiento.
* **Entregables:**
  * `src/services/cacheService.ts`: Implementación de LRU Cache en memoria para respuestas y para mapeo de IDs.
  * `src/services/tmdbClient.ts`: Conector con `/discover/movie`, `/discover/tv` y resolución de `external_ids` para obtener `imdb_id`.
  * `src/services/queryParser.ts`: Analizador sintáctico para interpretar búsquedas libres (ej. detectar si el usuario busca `"2022"`, `">7.5"`, o géneros combinados).
* **Criterio de éxito:** Pruebas unitarias que verifiquen que una consulta por año y nota devuelve los títulos esperados con sus correspondientes IDs `tt...` y que la segunda llamada se resuelve de inmediato desde la caché.

---

### Fase 3: Rutas de Catálogo y Paginación
* **Objetivo:** Exponer los endpoints dinámicos de catálogo compatibles con Stremio, Nuvio y Alder.
* **Entregables:**
  * `src/routes/catalog.ts`: Manejador de la ruta `GET /catalog/:type/:id/:extra?.json`.
  * Soporte de filtros por el selector `genre` (Años y Notas).
  * Soporte del parámetro `skip` para paginación continua en la interfaz.
  * Soporte del parámetro `search` para búsqueda directa desde el buscador global del cliente.
* **Criterio de éxito:** Añadir el addon a una instalación de Stremio local o Nuvio y poder navegar por las distintas categorías de año y nota en la pestaña *Discover*.

---

### Fase 4: Página de Configuración Dinámica (`/configure`)
* **Objetivo:** Permitir a los usuarios generar su propia versión personalizada del addon.
* **Entregables:**
  * `src/views/configure.html`: Interfaz web interactiva y ligera (diseño limpio y accesible).
  * `src/routes/configure.ts`: Generador del enlace de instalación con los filtros seleccionados codificados en la URL (`/:config/manifest.json`).
  * Opciones configurables:
    * Clave API de TMDB propia (opcional).
    * Filtro mínimo de votos (por defecto 200).
    * Catálogos activos que aparecerán en la pantalla de inicio.
* **Criterio de éxito:** Abrir `http://localhost:7000/configure`, pulsar "Instalar en Stremio" y verificar que se sincronizan los carruseles elegidos.

---

### Fase 5: Pruebas, Dockerización y Despliegue
* **Objetivo:** Asegurar la calidad, estabilidad y facilitar el despliegue para la comunidad.
* **Entregables:**
  * Suite de tests unitarios (con Jest o Vitest).
  * `Dockerfile` ligero multietapa para ejecución en cualquier VPS o contenedor.
  * `docker-compose.yml` para despliegue local o en servidor.
  * Documentación final de instalación y publicación comunitaria en `README.md`.
* **Criterio de éxito:** Despliegue en contenedor Docker respondiendo a pruebas de carga locales sin degradación de memoria.
