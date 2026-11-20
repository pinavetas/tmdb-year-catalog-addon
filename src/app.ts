import { CONFIG } from './config.js';
import { LOGO_PNG_BASE64 } from './assets/logo.js';
import { ADDON_ID, ADDON_VERSION, getManifest } from './routes/manifest.js';
import { handleCatalog } from './routes/catalog.js';
import { renderConfigure } from './routes/configure.js';
import { getBaseUrl } from './utils/baseUrl.js';
import { createAddonApp } from './kit/platform.js';

/**
 * Hono Addon Application, built on the shared Pina addon kit (src/kit, see docs/PINA_ADDON_KIT.md).
 *
 * The kit mounts what every addon of the family shares: root -> /configure, /configure and
 * /:config/configure, /logo.png, /favicon.ico, /robots.txt, /health, /stats.json (usage metrics),
 * CORS, opt-in request log without secrets (LOG_REQUESTS=1), JSON 404/500.
 * This file only adds the Stremio protocol routes of this addon.
 *
 * Entry points: api/index.ts (Vercel) and src/node.ts (Node/Docker).
 */
export const app = createAddonApp({
  id: ADDON_ID,
  version: ADDON_VERSION,
  // Own star logo: this addon keeps its brand (not a Pina glyph)
  logoPng: Buffer.from(LOGO_PNG_BASE64, 'base64'),
  configurePage: renderConfigure,
  healthExtra: () => ({ tmdbKeyConfigured: Boolean(CONFIG.TMDB_API_KEY) })
});

// Manifest (default and configured)
const MANIFEST_CACHE = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

app.get('/manifest.json', (c) => {
  c.header('Cache-Control', MANIFEST_CACHE);
  return c.json(getManifest(undefined, getBaseUrl(c)));
});

app.get('/:config/manifest.json', (c) => {
  c.header('Cache-Control', MANIFEST_CACHE);
  return c.json(getManifest(c.req.param('config'), getBaseUrl(c)));
});

// Catalogs (default and configured)
app.get('/catalog/:type/:id', handleCatalog);
app.get('/catalog/:type/:id/:extra{.+}', handleCatalog);
app.get('/:config/catalog/:type/:id', handleCatalog);
app.get('/:config/catalog/:type/:id/:extra{.+}', handleCatalog);

export default app;
