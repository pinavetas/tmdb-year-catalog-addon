import type { Context } from 'hono';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.resolve(__dirname, '../views/configure.html');

let cachedHtml: string | null = null;

export function handleConfigure(c: Context): Response {
  if (!cachedHtml) {
    try {
      cachedHtml = fs.readFileSync(htmlPath, 'utf-8');
    } catch {
      cachedHtml = `<h1>Error cargando configure.html</h1>`;
    }
  }

  c.header('Content-Type', 'text/html; charset=utf-8');
  return c.html(cachedHtml);
}
