/**
 * Servidor HTTP standalone para Node.js (desarrollo local, Docker, VPS, Render...).
 * En Vercel no se usa este archivo: la plataforma importa directamente `src/app.ts`.
 */
import { serve } from '@hono/node-server';
import { CONFIG } from './config.js';
import { app } from './app.js';

if (!CONFIG.TMDB_API_KEY) {
  console.warn('[WARN] TMDB_API_KEY no está configurada: los catálogos solo funcionarán con usuarios que aporten su propia clave.');
}

const server = serve(
  {
    fetch: app.fetch,
    port: CONFIG.PORT,
    hostname: CONFIG.HOST
  },
  (info) => {
    const host = info.address === '0.0.0.0' || info.address === '::' ? 'localhost' : info.address;
    console.log(`[OK] Addon activo en http://${host}:${info.port}/manifest.json`);
    console.log(`[OK] Configuración en http://${host}:${info.port}/configure`);
  }
);

// Cierre ordenado (Docker envía SIGTERM al detener el contenedor)
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
