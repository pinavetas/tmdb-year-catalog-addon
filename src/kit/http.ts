import type { Context } from 'hono';

function firstHeaderValue(value?: string): string | undefined {
  return value?.split(',')[0]?.trim() || undefined;
}

/**
 * URL base pública (esquema + host) con la que el cliente ha llegado al addon.
 * Respeta `publicUrl` (PUBLIC_URL) si está definida y las cabeceras X-Forwarded-* de proxies como
 * Vercel, donde la petición llega internamente por HTTP aunque el cliente use HTTPS.
 */
export function getBaseUrl(c: Context, publicUrl = ''): string {
  if (publicUrl) return publicUrl;
  const url = new URL(c.req.url);
  const proto = firstHeaderValue(c.req.header('x-forwarded-proto')) || url.protocol.replace(':', '');
  const host = firstHeaderValue(c.req.header('x-forwarded-host')) || c.req.header('host') || url.host;
  return `${proto}://${host}`;
}

/** Normaliza PUBLIC_URL quitando las barras finales (evita `https://x.com//logo.png`). */
export function normalizePublicUrl(value: string | undefined): string {
  return (value || '').trim().replace(/\/+$/, '');
}

/** Elimina la extensión `.json` final de un parámetro de ruta de Stremio. */
export function stripJsonExtension(value: string): string {
  return value.endsWith('.json') ? value.slice(0, -'.json'.length) : value;
}

/**
 * Oculta secretos al escribir rutas en los logs: el segmento de configuración del usuario
 * (`/<base64url>/...`, puede llevar claves de API) y el parámetro `key` (acceso a /stats.json).
 */
export function redactPath(path: string): string {
  return path
    .replace(/^\/([A-Za-z0-9_-]{16,})(?=\/)/, '/[config]')
    .replace(/([?&]key=)[^&\s]+/g, '$1[redacted]');
}

/** Escapa texto para insertarlo de forma segura en HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Serializa un valor para incrustarlo dentro de `<script>` sin poder cerrar la etiqueta. */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, BACKSLASH + 'u003c')
    .replace(LINE_SEPARATOR, BACKSLASH + 'u2028')
    .replace(PARAGRAPH_SEPARATOR, BACKSLASH + 'u2029');
}

// Construidos con códigos de carácter para no depender de escapes en el fuente
const BACKSLASH = String.fromCharCode(0x5c);
const LINE_SEPARATOR = new RegExp(String.fromCharCode(0x2028), 'g');
const PARAGRAPH_SEPARATOR = new RegExp(String.fromCharCode(0x2029), 'g');
