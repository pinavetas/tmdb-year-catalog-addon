import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { CONFIG } from './config.js';
import { getManifest } from './routes/manifest.js';
import { handleCatalog } from './routes/catalog.js';

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

// Home / Healthcheck route
app.get('/', (c) => {
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
        .btn { display: inline-block; background: #0284c7; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; margin-top: 1rem; transition: background 0.2s; }
        .btn:hover { background: #0369a1; }
        .code { background: #0f172a; padding: 0.4rem 0.8rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.85rem; color: #38bdf8; word-break: break-all; margin: 1rem 0; display: block; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>⭐ Buscador IMDb & Año Addon</h1>
        <p>Addon de catálogo activo para Stremio, Nuvio y Alder. Filtra películas y series por puntuación IMDb y año de estreno.</p>
        <span class="code">http://${CONFIG.HOST === '0.0.0.0' ? 'localhost' : CONFIG.HOST}:${CONFIG.PORT}/manifest.json</span>
        <a href="/manifest.json" class="btn">Ver Manifiesto</a>
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
