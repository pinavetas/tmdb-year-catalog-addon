import { serve } from '@hono/node-server';
import { CONFIG } from './config.js';
import { app } from './app.js';

console.log(`[INFO] Servidor iniciando en http://${CONFIG.HOST}:${CONFIG.PORT}`);
serve({
  fetch: app.fetch,
  port: CONFIG.PORT,
  hostname: CONFIG.HOST
}, (info) => {
  console.log(`[OK] Addon activo en http://${info.address}:${info.port}/manifest.json`);
});
