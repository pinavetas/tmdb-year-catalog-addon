import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { CONFIG } from './config.js';
import { getManifest } from './routes/manifest.js';
import { handleCatalog } from './routes/catalog.js';
import { handleConfigure } from './routes/configure.js';

export const app = new Hono();

// Middlewares
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Range', 'User-Agent'],
  exposeHeaders: ['Content-Length', 'Content-Range'],
  maxAge: 86400
}));

/**
 * Obtiene la URL base pública del addon, priorizando PUBLIC_URL,
 * luego cabeceras de proxy, y finalmente el host del request.
 */
function getBaseUrl(c: { req: { header: (name: string) => string | undefined; url: string } }): string {
  if (CONFIG.PUBLIC_URL) return CONFIG.PUBLIC_URL;

  const proto = c.req.header('x-forwarded-proto') || 'http';
  const host = c.req.header('x-forwarded-host') || c.req.header('host');
  if (host) return `${proto}://${host}`;

  return `http://localhost:${CONFIG.PORT}`;
}

// Logo SVG inline para el manifiesto de Stremio
app.get('/logo.svg', (c) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="48" fill="#0f172a"/>
  <polygon points="128,35 155,100 225,100 167,142 189,210 128,168 67,210 89,142 31,100 101,100" fill="#f59e0b" stroke="#fbbf24" stroke-width="2"/>
  <text x="128" y="246" font-size="24" font-family="Arial,sans-serif" font-weight="bold" fill="#38bdf8" text-anchor="middle">CATÁLOGO</text>
</svg>`;
  c.header('Content-Type', 'image/svg+xml');
  c.header('Cache-Control', 'public, max-age=604800');
  return c.body(svg);
});

// Página de Configuración Interactiva
app.get('/configure', handleConfigure);

// Home / Healthcheck route
app.get('/', (c) => {
  const baseUrl = getBaseUrl(c);
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>IMDb & Year Catalog Addon</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 480px; text-align: center; border: 1px solid #334155; }
        h1 { margin-top: 0; color: #38bdf8; font-size: 1.5rem; }
        p { color: #94a3b8; line-height: 1.5; font-size: 0.95rem; }
        .btn-group { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.25rem; flex-wrap: wrap; }
        .btn { display: inline-block; background: #0284c7; color: white; text-decoration: none; padding: 0.75rem 1.25rem; border-radius: 0.5rem; font-weight: 600; transition: background 0.2s; }
        .btn:hover { background: #0369a1; }
        .btn-secondary { background: #334155; }
        .btn-secondary:hover { background: #475569; }
        .code { background: #0f172a; padding: 0.4rem 0.8rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.85rem; color: #38bdf8; word-break: break-all; margin: 1rem 0; display: block; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>⭐ Buscador IMDb & Año Addon</h1>
        <p>Addon de catálogo activo para Stremio, Nuvio y Alder. Filtra películas y series por puntuación IMDb y año de estreno.</p>
        <span class="code">${baseUrl}/manifest.json</span>
        <div class="btn-group">
          <a href="/configure" class="btn">⚙️ Configurar e Instalar</a>
          <a href="/manifest.json" class="btn btn-secondary">Ver Manifiesto</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Rutas del Manifiesto
app.get('/manifest.json', (c) => {
  return c.json(getManifest());
});

app.get('/:config/manifest.json', (c) => {
  const config = c.req.param('config');
  return c.json(getManifest(config));
});

// Rutas de Catálogo (Estándar)
app.get('/catalog/:type/:id', handleCatalog);
app.get('/catalog/:type/:id/:extra{.+}', handleCatalog);

// Rutas de Catálogo (Con configuración de usuario)
app.get('/:config/catalog/:type/:id', handleCatalog);
app.get('/:config/catalog/:type/:id/:extra{.+}', handleCatalog);

export default app;
