/**
 * Standalone HTTP server for Node.js (local development, Docker, VPS, Render...).
 * In Vercel, this file is not used: the entry point is `api/index.ts`.
 */
import { serve } from '@hono/node-server';
import { CONFIG } from './config.js';
import { app } from './app.js';
import { installProcessGuards, serverErrorHandler } from './kit/runtime.js';

// Pina family process policy: an uncaught exception exits so Docker/PM2 restart a clean process
installProcessGuards();

if (!CONFIG.TMDB_API_KEY) {
  console.warn('[WARN] TMDB_API_KEY is not configured: catalogs will only work for users providing their own key.');
}

const server = serve(
  {
    fetch: app.fetch,
    port: CONFIG.PORT,
    hostname: CONFIG.HOST
  },
  (info) => {
    const host = info.address === '0.0.0.0' || info.address === '::' ? 'localhost' : info.address;
    console.log(`[OK] Addon live at http://${host}:${info.port}/manifest.json`);
    console.log(`[OK] Configuration at http://${host}:${info.port}/configure`);
  }
);

server.on('error', serverErrorHandler(CONFIG.PORT));

// Graceful shutdown (Docker sends SIGTERM when stopping container)
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
