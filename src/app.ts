import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { html } from 'hono/html';
import { CONFIG } from './config.js';
import { LOGO_PNG_BASE64 } from './assets/logo.js';
import { ADDON_VERSION, getManifest } from './routes/manifest.js';
import { handleCatalog } from './routes/catalog.js';
import { handleConfigure } from './routes/configure.js';

/**
 * Aplicación Hono del addon.
 *
 * Este módulo exporta la app por defecto: es el punto de entrada que Vercel detecta
 * automáticamente (`src/app.ts`). Para Node/Docker se usa `src/node.ts`, que la sirve
 * con @hono/node-server.
 */
export const app = new Hono();

const LOGO_PNG = Buffer.from(LOGO_PNG_BASE64, 'base64');

// Middlewares
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'HEAD', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Range', 'User-Agent'],
    maxAge: 86400
  })
);

/**
 * URL base pública del addon: PUBLIC_URL si está definida; si no, se deduce de las cabeceras
 * del proxy (Vercel envía x-forwarded-proto/x-forwarded-host) o del propio request.
 */
function getBaseUrl(c: Context): string {
  if (CONFIG.PUBLIC_URL) return CONFIG.PUBLIC_URL;

  const url = new URL(c.req.url);
  const proto = (c.req.header('x-forwarded-proto') || url.protocol.replace(':', '')).split(',')[0].trim();
  const host = (c.req.header('x-forwarded-host') || c.req.header('host') || url.host).split(',')[0].trim();
  return `${proto}://${host}`;
}

// Logo PNG 256x256 (formato recomendado por Stremio para el manifiesto)
app.get('/logo.png', (c) => {
  c.header('Content-Type', 'image/png');
  c.header('Cache-Control', 'public, max-age=604800, immutable');
  return c.body(LOGO_PNG);
});

app.get('/favicon.ico', (c) => c.redirect('/logo.png', 301));

// Página de configuración (sin configuración previa y desde un addon ya configurado)
app.get('/configure', handleConfigure);
app.get('/:config/configure', handleConfigure);

// Healthcheck
app.get('/health', (c) => {
  c.header('Cache-Control', 'no-store');
  return c.json({ status: 'ok', version: ADDON_VERSION, tmdbKeyConfigured: Boolean(CONFIG.TMDB_API_KEY) });
});

// Portada
app.get('/', (c) => {
  const manifestUrl = `${getBaseUrl(c)}/manifest.json`;
  c.header('Cache-Control', 'public, max-age=3600');
  return c.html(html`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buscador IMDb, País y Año · Addon para Stremio</title>
  <meta name="description" content="Addon de catálogo para Stremio, Nuvio y Alder: películas y series por país, año y puntuación.">
  <link rel="icon" type="image/png" href="/logo.png">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
    .card { background: #1e293b; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 480px; width: 100%; text-align: center; border: 1px solid #334155; box-sizing: border-box; }
    img { width: 80px; height: 80px; border-radius: 18px; }
    h1 { color: #38bdf8; font-size: 1.5rem; }
    p { color: #94a3b8; line-height: 1.5; font-size: 0.95rem; }
    .btn-group { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.25rem; flex-wrap: wrap; }
    .btn { display: inline-block; background: #0284c7; color: white; text-decoration: none; padding: 0.75rem 1.25rem; border-radius: 0.5rem; font-weight: 600; transition: background 0.2s; }
    .btn:hover { background: #0369a1; }
    .btn-secondary { background: #334155; }
    .btn-secondary:hover { background: #475569; }
    .code { background: #0f172a; padding: 0.4rem 0.8rem; border-radius: 0.25rem; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.85rem; color: #38bdf8; word-break: break-all; margin: 1rem 0; display: block; }
    small { color: #64748b; font-size: 0.75rem; }
  </style>
</head>
<body>
  <main class="card">
    <img src="/logo.png" alt="" width="80" height="80">
    <h1>Buscador IMDb, País y Año</h1>
    <p>Addon de catálogo para Stremio, Nuvio y Alder. Explora películas y series por país de origen, año o época y puntuación.</p>
    <span class="code">${manifestUrl}</span>
    <div class="btn-group">
      <a href="/configure" class="btn">⚙️ Configurar e instalar</a>
      <a href="/manifest.json" class="btn btn-secondary">Ver manifiesto</a>
    </div>
    <p><small>v${ADDON_VERSION} · Datos de TMDB. Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.</small></p>
  </main>
</body>
</html>`);
});

// Manifiesto (por defecto y con configuración de usuario)
const MANIFEST_CACHE = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

app.get('/manifest.json', (c) => {
  c.header('Cache-Control', MANIFEST_CACHE);
  return c.json(getManifest(undefined, getBaseUrl(c)));
});

app.get('/:config/manifest.json', (c) => {
  c.header('Cache-Control', MANIFEST_CACHE);
  return c.json(getManifest(c.req.param('config'), getBaseUrl(c)));
});

// Catálogos (estándar y con configuración de usuario)
app.get('/catalog/:type/:id', handleCatalog);
app.get('/catalog/:type/:id/:extra{.+}', handleCatalog);
app.get('/:config/catalog/:type/:id', handleCatalog);
app.get('/:config/catalog/:type/:id/:extra{.+}', handleCatalog);

// 404 en JSON (con CORS) para cualquier otra ruta
app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error('[ERROR]', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
