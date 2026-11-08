import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
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

// Raíz: redirige directamente a la página de configuración (estándar en addons de Stremio)
app.get('/', (c) => c.redirect('/configure', 302));

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
