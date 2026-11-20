# Kit de addons Pina: arquitectura común

Arquitectura, identidad y convenciones compartidas por todos los add-ons de Stremio/Nuvio/Alder
de **pinadev** (la familia **Pina**). El objetivo es doble: crear un addon nuevo en minutos y que
quien use cualquiera de ellos lo reconozca como «de Pina» a primera vista.

* **Fuente de verdad del kit:** `pina-stremio-addon/src/kit/` (versión en `KIT_VERSION`, `src/kit/brand.ts`).
* **Plantilla de addon nuevo:** `pina-stremio-addon/templates/addon/` + `npm run new-addon`.
* **Origen del diseño:** PinaSports (`live-sport-plugin/public/ui.css` y `configure.html`). Las
  decisiones de producto de ese rediseño se recogen aquí como reglas de familia.

---

## 1. La familia

| Addon | Repo | Stack | Glifo | Estado del kit |
| :--- | :--- | :--- | :--- | :--- |
| **PinaSports** | `live-sport-plugin` (`pina-sports-stremio-addon`) | Express + JS (CommonJS) | «play» con líneas de campo | Diseño de origen; métricas portadas a mano (Web Analytics + contador de uso, base `pina_sports`) |
| **PinaStreams** | `pina-stremio-addon` | Hono + TypeScript | «play» sobre barras de subtítulos | Kit completo (referencia), base `pina_streams` |
| *(catálogos TMDB)* | `imdb-year-catalog-addon` | Hono + TypeScript | — | Aún sin marca Pina; tiene el contador de uso original |

### Nombres e identificadores

| Elemento | Convención | Ejemplo |
| :--- | :--- | :--- |
| Producto | Una palabra en PascalCase | `Streams` |
| Marca de palabra (cabecera) | `Pina` + `<b>Producto</b>` en lima | **PINA**<span>STREAMS</span> |
| Nombre legible (manifiesto, título, pie) | `Pina Producto` | `Pina Streams` |
| Paquete / repo | `pina-<producto>-stremio-addon` | `pina-sports-stremio-addon` |
| `id` del manifiesto | `community.pina-<producto>` | `community.pina-sports` |
| `<title>` | `Pina Producto \| Setup` · `Pina Producto \| Configuración` | |
| Pie | `Pina Producto · Stremio Add-on` · `Pina Producto · Add-on para Stremio` | |

> **«Pina» no es una piña.** Nada de frutas, hojas ni amarillos de piña en logos o textos.
> El `id` de un addon publicado **no se cambia nunca** (Stremio reconoce las instalaciones por él):
> PinaStreams conserva el suyo histórico, `community.pina-addon`.

### Marca y logo

* **Baldosa lima inclinada** (`skewX(-8deg)`, esquinas redondeadas, degradado `#d4ff6b ➔ #b2ee1e`)
  con un **glifo negro** (`#0a0c0f`) propio de cada addon. Es la firma de la familia.
* El glifo se define una vez en `src/brand.ts` (caja 24×24, primitivas `polygon` con `r`, `rect`,
  `circle`) y el kit lo pinta en tres sitios: la marca de la barra superior (SVG), `/favicon.svg` y
  `/logo.png` (PNG 256×256 generado en memoria, sin dependencias ni ficheros binarios).
* Las formas se unen (todas en negro): no se pueden hacer huecos. Buscar una silueta que se
  distinga de las demás de la familia a 16 px.

### Sistema visual (`src/kit/ui/theme.ts`)

* Aspecto de retransmisión, **solo oscuro**: fondos `#0a0c0f`/`#12161b`, líneas `#232a33`.
* **Un único acento lima** `#c6ff3d` para estados activos y la acción principal; tinta `#0a0c0f`
  sobre lima. Rojo `#ff5a5a` solo para errores. Coral `#ff5e5b` solo para Ko-fi.
* Tipografías: **Barlow Condensed** (títulos, etiquetas, cifras, en mayúsculas con tracking) e
  **Inter** (texto). Cargadas de Google Fonts.
* Componentes: `topbar`, `hero` con antetítulo, `panel` numerado (`01`, `02`…), baldosas
  activables (`tile`) con contador `n/total` y «Todas · Ninguna», control segmentado, interruptor,
  selector numérico, chips ordenables, desplegables, tarjeta de apoyo, tarjeta de instalación con
  marcador y barra de instalación fija en móvil.
* Foco visible en todo (teclado y mando de TV) y `prefers-reduced-motion`.
* No añadir colores sueltos en las páginas: usar los tokens (`var(--accent)`, `var(--muted)`…).

---

## 2. Estructura de un addon

```text
pina-<producto>-stremio-addon/
├── docs/PINA_ADDON_KIT.md     # este documento (copiado)
├── scripts/build-vercel.mjs   # esbuild ➔ .vercel/output (Build Output API v3, Node 26, cdg1)
├── src/
│   ├── kit/                   # KIT COMÚN: se copia, no se edita en el addon
│   │   ├── brand.ts           # FAMILY (Ko-fi, apoyo), colores, AddonBrand/Glyph, KIT_VERSION
│   │   ├── glyph.ts           # glifo ➔ SVG (marca, favicon) y PNG (logo)
│   │   ├── http.ts            # getBaseUrl (X-Forwarded-*), redactPath, escapeHtml, jsonForScript
│   │   ├── platform.ts        # createAddonApp(): middlewares + rutas comunes
│   │   ├── stremio.ts         # tipos mínimos del protocolo v3
│   │   ├── usage.ts           # métricas anónimas (Neon) + /stats.json
│   │   └── ui/
│   │       ├── theme.ts       # PINA_CSS (sistema visual)
│   │       ├── i18n.ts        # EN/ES: detección, textos comunes (kit_*), traductor del servidor
│   │       ├── page.ts        # renderConfigurePage(): anatomía común de /configure
│   │       ├── components.ts  # panel, tile, segmented, toggle, stepper, disclosure…
│   │       └── client.ts      # window.PinaKit (navegador) + snippet de Web Analytics
│   ├── brand.ts               # producto + glifo del addon
│   ├── config.ts              # ADDON_ID, ADDON_VERSION, variables de entorno
│   ├── types/config.ts        # configuración del usuario: sanitize/encode/decode (+ installId)
│   ├── routes/                # manifiesto y recursos del protocolo (catalog, meta, stream…)
│   ├── views/configurePage.ts # textos EN/ES, secciones y script de /configure
│   ├── app.ts                 # createAddonApp(...) + rutas del protocolo
│   ├── index.ts               # servidor Node/Docker
│   └── vercel.ts              # entrada de Vercel Functions
├── tests/                     # node:test + tsx; helpers/hermeticEnv.ts limpia el entorno
├── vercel.json                # npm ci + npm run vercel-build, regions ["cdg1"]
└── tsconfig.json / tsconfig.check.json
```

**Regla de dependencias:** nada de `src/kit/` importa código del addon. El addon importa del kit.

---

## 3. Rutas

### Comunes (las monta `createAddonApp`)

| Ruta | Respuesta |
| :--- | :--- |
| `GET /` | **302 ➔ `/configure`**: la raíz siempre lleva a la configuración (no hay portada). |
| `GET /configure`, `GET /:config/configure` | Página de configuración (el engranaje de Stremio abre la segunda con los ajustes actuales). |
| `GET /logo.png` | Logo 256×256 del glifo (el manifiesto apunta aquí con URL absoluta). |
| `GET /favicon.svg` · `/favicon.ico` | Marca en SVG · redirige al PNG. |
| `GET /robots.txt` | `noindex: true` ➔ todo excluido; si no, solo `/configure` indexable. |
| `GET /health` | `{ status, id, version }`, sin llamadas a terceros. |
| `GET /stats.json?key=STATS_KEY` | Métricas agregadas; **404** sin clave válida o sin base de datos. |

Además: CORS abierto (`GET, HEAD, OPTIONS`), log `MÉTODO /ruta estado ms` **sin** el segmento de
configuración ni `?key=`, 404 y 500 en JSON, y `X-Robots-Tag: noindex` si `noindex`.

### Del addon

`/manifest.json` y `/:config/manifest.json` siempre; luego los recursos que declare
(`/:config/catalog/...`, `/:config/meta/...`, `/:config/stream/...`, `/:config/subtitles/...`),
cada uno también sin `/:config` (instalación con valores por defecto).

---

## 4. Configuración del usuario

* Viaja **en la URL**: `/<base64url(JSON)>/manifest.json`. No hay base de datos de usuarios ni
  sesiones; reinstalar es la única forma de cambiar ajustes.
* `sanitizeConfig` descarta lo desconocido o inválido y aplica valores por defecto. Nunca falla.
* El manifiesto **nunca exige configurar** (`configurationRequired: false`): todo tiene defecto.
* Claves de terceros (TMDB, RPDB…) son opcionales, del usuario, viajan en su URL y se validan en
  el navegador antes de dejar instalar. Nunca se escriben en logs.
* **`installId`**: /configure genera un identificador aleatorio (16 caracteres base64url) y lo
  conserva al reconfigurar. Solo sirve para las métricas (§6). No identifica a la persona.
* Sin control de acceso: si un addon debe ser privado, la privacidad es por red (VPS propio).

---

## 5. Página de configuración

### Anatomía (fija en toda la familia, `renderConfigurePage`)

```text
┌ barra: [marca] PINA<b>PRODUCTO</b> ··········· [EN|ES]  ADD-ON DE STREMIO ┐
│ encabezado: ── ANTETÍTULO / TÍTULO CON <em>PALABRA</em> EN LIMA / entradilla │
├ contenido ─────────────────────────────────────┬ carril (fijo al bajar) ───┤
│ avisos (HTTP / localhost)                       │ ☕ Apoya el Add-on (Ko-fi) │
│ 01 · SECCIÓN PRINCIPAL                          │ ▬ LISTO PARA INSTALAR     │
│ 02 · …                                          │   marcador del resumen    │
│ 0n · AVANZADO (opcional, al final)              │   Instalar en Stremio     │
│                                                 │   Abrir en Stremio Web    │
│                                                 │   Copiar enlace           │
│                                                 │   enlace + guía para TV   │
├─────────────────────────────────────────────────┴───────────────────────────┤
│ pie: Pina Producto · Stremio Add-on            vX.Y.Z · Ko-fi · pinadev    │
└ móvil: barra fija «15 enlaces · 3 fuentes [INSTALAR]» cuando la tarjeta no se ve ┘
```

### Decisiones de producto (heredadas del rediseño de PinaSports)

1. **La raíz lleva a `/configure`.** Sin portada ni reproductor en el navegador: el addon es la
   página de configuración y la API de Stremio (menos superficie y menos exposición).
2. **Secciones numeradas y centradas en el usuario** (`01`, `02`…), lo más usado primero y lo
   avanzado u opcional al final.
3. **Valores por defecto prudentes:** activadas solo las opciones recomendadas y estables; lo
   experimental, ruidoso o que abre webs externas, desactivado.
4. **Ko-fi encima de la instalación**, en el carril, en todas las páginas de la familia
   (`https://ko-fi.com/pinadev` + «Más formas de colaborar» ➔ `pinadev-web.vercel.app/support`).
5. **Resumen tipo marcador** de lo elegido en la tarjeta de instalación, que se actualiza al
   instante; botón principal «Instalar en Stremio» (`stremio://`), Stremio Web y copiar enlace.
6. **Inglés y español** con detección automática: si el navegador incluye español en cualquier
   posición ➔ español; si no ➔ inglés. Botones EN | ES; la elección se recuerda (`pina_lang`).
   El servidor ya pinta la página en el idioma de `Accept-Language` (sin parpadeo).
7. Avisos automáticos si la página se abre por HTTP o como `localhost` (Stremio solo instala por
   HTTPS, salvo `127.0.0.1` en el mismo equipo).
8. Los ajustes que solo aplican a otra opción se muestran solo cuando esa opción está activa.

### Textos (`STRINGS` del addon)

* Diccionario `{ en, es }` por addon. Claves obligatorias: `page_title`, `hero_eyebrow`,
  `hero_title` (HTML, con `<em>` para la palabra en lima) y `hero_lede`.
* Las claves `kit_*` son del kit (apoyo, instalación, avisos, pie…) y no se pueden pisar.
* `{name}` se sustituye por el nombre del addon; `{n}`… los rellena el script con `PinaKit.t(key, vars)`.
* Valores HTML (`data-i18n-html`) solo con textos propios, nunca con datos del usuario.

### Componentes del servidor (`components.ts`)

`panel`, `tileTools` + `tileGrid` + `tile`, `segmented`, `toggle`, `stepper`, `disclosure`,
`groupLabel` e `i18nText`. Reciben **claves**, no textos.

### Script del addon (`window.PinaKit`)

ES5 dentro de un `String.raw` (sin backticks ni `${`). Esquema mínimo:

```js
(function () {
  var K = window.PinaKit;
  var sources = K.bindTiles('sourcesGrid', { counterId: 'sourcesCount', allId: 'sourcesAll', noneId: 'sourcesNone', onChange: K.refresh });
  var existing = K.readPathConfig() || {};              // reconfigurar desde el engranaje
  var installId = existing.installId || K.newInstallId(); // misma instalación al reconfigurar
  K.bindInstall(function () {
    return {
      config: { /* ajustes */, installId: installId },
      ready: true,                                       // false bloquea la instalación (dato inválido)
      summary: [{ k: K.t('sum_x'), v: '…', tone: 'accent' | 'bad' | '' }],
      dock: [{ v: '3', label: K.t('dock_sources') }]
    };
  });
  K.onLang(function () { /* repintar textos dinámicos */ });
  K.start();                                             // idioma + pintado inicial
})();
```

---

## 6. Métricas de instalación y uso

Tres piezas, todas opcionales y sin datos personales:

| Qué | Cómo | Dónde se ve |
| :--- | :--- | :--- |
| Visitas a `/configure` | **Vercel Web Analytics** (solo páginas vistas, sin cookies). El snippet reduce `/<config>/configure` a `/configure` y quita consulta y fragmento. Solo se incluye en Vercel. | Panel de Vercel ➔ Analytics (hay que activarlo en el proyecto). |
| Instalaciones usadas y uso diario | **Contador anónimo** (`kit/usage.ts`): por cada petición del protocolo guarda `(día UTC, HMAC(USAGE_SALT, id de instalación), app cliente)`. Primera aparición de un id = instalación nueva. | `GET /stats.json?key=STATS_KEY` |
| Apps cliente | Primer token del User-Agent normalizado (`nuvio`, `okhttp`, `stremio`…). | `clientsLast7d` de /stats.json |

* **Herramientas propias:** las peticiones con `User-Agent: pina-tools/<herramienta>` (prueba de
  humo, rendimiento…) no cuentan. Cualquier script que llame al addon desplegado debe usarlo.
* **Identidad:** `installId` de la configuración; en instalaciones anteriores a él, el segmento de
  configuración (con HMAC). Sin configuración no se cuenta. Nunca IPs, claves ni títulos.
* **Coste:** Neon escala a cero; las filas se acumulan en memoria y se escriben de una vez con la
  primera petición de cada hora UTC que tenga algo pendiente (como mucho un despertar por hora e
  instancia; con tráfico continuo todas coinciden en hh:00). La escritura va tras la respuesta
  (`waitUntil` de Vercel). Si falla, se reintenta la hora siguiente.
* **Limitaciones:** lo que sirve la CDN de Vercel no llega a la función (no cuenta, pero esa
  instalación ya contó ese día); las filas pendientes de una instancia que se apaga antes de la
  siguiente hora se pierden. Son métricas orientativas, no contabilidad.
* **Variables** (Vercel ➔ Settings ➔ Environment Variables, solo *Production*):
  `DATABASE_URL` (Neon), `USAGE_SALT` (≥16 caracteres aleatorios, no cambiarlo: rompería la
  continuidad), `STATS_KEY` (≥16). Sin `DATABASE_URL` o `USAGE_SALT`, todo queda desactivado.
* **Base de datos:** una base de datos por addon dentro del mismo proyecto Neon de la familia
  (comparten el cómputo y su ventana horaria). La tabla `usage_days` se crea sola. Hoy: proyecto
  `tmdb-year-catalog-stats` con `neondb` (catálogos TMDB), `pina_streams` y `pina_sports`.
* **Coste de caché:** con `installId` en la URL, las respuestas cacheables (catálogos) se guardan
  en la CDN por instalación en lugar de compartirse entre instalaciones con los mismos ajustes.

Respuesta de `/stats.json`:

```json
{
  "addon": "community.pina-addon", "version": "1.2.0", "generatedAt": "…",
  "activeUsers": { "today": 3, "last7d": 9, "last30d": 21, "allTime": 40 },
  "daily": [{ "day": "2026-11-20", "activeUsers": 3, "newUsers": 1 }],
  "clientsLast7d": [{ "client": "nuvio", "users": 5 }]
}
```

---

## 7. Despliegue y flujo de trabajo

* **Vercel** con Build Output API v3: `vercel.json` ejecuta `npm run vercel-build` = typecheck +
  tests + `scripts/build-vercel.mjs` (un único bundle CJS con esbuild, Node 26, región `cdg1`).
  Si algo falla, Vercel no despliega. `/_vercel/*` queda fuera de la función (Web Analytics).
* **Ramas:** `develop` (trabajo diario, previews) ➔ PR ➔ `master` (producción). GitHub Actions
  solo en PRs `develop ➔ master` (plan gratuito).
* **Node/Docker** opcional: `src/index.ts` con `@hono/node-server`.
* **Tests herméticos:** `tests/helpers/hermeticEnv.ts` borra las variables del addon (incluidas
  las de métricas) antes de los tests, porque el build de Vercel los ejecuta con las del proyecto.

---

## 8. Invariantes de la familia

1. **Cero vídeo a través de la función.** Se devuelven enlaces que reproduce el cliente (con
   `behaviorHints.proxyHeaders` si hacen falta cabeceras). Nunca rutas que sirvan, reenvíen o
   redirijan vídeo o subtítulos: consumirían el ancho de banda de Vercel.
2. **Nada secreto en logs** (segmento de configuración, claves, `?key=`).
3. **Configuración solo en la URL** y siempre saneada; nunca `configurationRequired: true`.
4. **El `id` del manifiesto no cambia** una vez publicado.
5. **URLs públicas derivadas de la petición** (`getBaseUrl`, `X-Forwarded-*`) o de `PUBLIC_URL`,
   nunca concatenadas a mano.
6. **Métricas anónimas y opcionales**; los tests nunca escriben en la base de datos real.
7. **El kit no depende del addon** y no se edita dentro de un addon.

---

## 9. Crear un addon nuevo

```bash
# desde pina-stremio-addon
npm run new-addon -- Cine ../pina-cine-stremio-addon
cd ../pina-cine-stremio-addon
git init && npm install
npm run vercel-build   # typecheck + tests + build
npm run dev            # http://localhost:7000/configure
```

Checklist:

1. `src/brand.ts`: glifo propio (distinguible a 16 px de los de la familia).
2. `src/config.ts`: confirmar `ADDON_ID` (`community.pina-<producto>`) antes de publicar.
3. `src/types/config.ts`: ajustes del usuario con valores por defecto prudentes + `installId`.
4. `src/routes/`: recursos del protocolo; actualizar `resources`/`types`/`catalogs` del manifiesto.
   Llamar a `getUsageCounter()?.record(installIdentity(...), userAgent)` en cada recurso.
5. `src/views/configurePage.ts`: textos EN/ES, secciones numeradas, resumen y barra móvil.
6. Tests: mantener los de la plantilla y añadir los del addon.
7. Vercel: importar el repo, región `cdg1`; métricas (§6) y Web Analytics si se quieren.
8. Añadir el addon a la tabla de la §1 de este documento (en `pina-stremio-addon`).

---

## 10. Actualizar el kit

1. Cambiar `pina-stremio-addon/src/kit/` y subir `KIT_VERSION` (`src/kit/brand.ts`).
2. Pasar sus tests (`tests/kit.test.ts`) y `npm run vercel-build`.
3. Copiar la carpeta `src/kit/` completa (y este documento) a cada addon TypeScript; ejecutar
   allí `npm run vercel-build`. Comprobar la versión con `grep KIT_VERSION src/kit/brand.ts`.

### Addons que no usan Hono/TypeScript (PinaSports, Express + JS)

No pueden importar el kit, así que se alinean a mano con estas equivalencias:

| Pieza del kit | En PinaSports |
| :--- | :--- |
| `theme.ts` (`PINA_CSS`) | `public/ui.css` (es su origen: mantener los mismos tokens) |
| `page.ts` + `client.ts` | `public/configure.html` (misma anatomía, mismos textos `kit_*`) |
| `ANALYTICS_SNIPPET` | `<script id="pinaAnalytics">` en el `<head>` de `public/configure.html` (con `id`: sus tests toman el primer `<script>` sin atributos como el de la página) y `/_vercel/` excluido en `vercel.json`. |
| `usage.ts` + `/stats.json` | `src/services/UsageCounter.js` (misma lógica; Neon por su endpoint HTTP con `fetch`, sin dependencia nueva) y `src/routes/usage.js` (`recordUsage` antes de la reescritura del segmento para el SDK; `/stats.json`). |
| `installId` | Generado y conservado en el script de `public/configure.html`. |
| Raíz ➔ `/configure`, Ko-fi encima de instalar, EN/ES | Ya aplicado. |
