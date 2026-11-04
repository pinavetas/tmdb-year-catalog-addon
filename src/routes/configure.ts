import type { Context } from 'hono';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.resolve(__dirname, '../views/configure.html');

let cachedHtml: string | null = null;
let cacheIsError = false;

export function handleConfigure(c: Context): Response {
  // Reintentar la lectura si la caché almacenó un error (ej. archivo no encontrado al inicio)
  if (!cachedHtml || cacheIsError) {
    try {
      cachedHtml = fs.readFileSync(htmlPath, 'utf-8');
      cacheIsError = false;
    } catch {
      cachedHtml = `<h1>Error cargando configure.html</h1>`;
      cacheIsError = true;
    }
  }

  c.header('Content-Type', 'text/html; charset=utf-8');
  return c.html(cachedHtml);
}
