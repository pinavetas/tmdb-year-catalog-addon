import type { Context } from 'hono';
import { CONFIG } from '../config.js';

/**
 * Public base URL of the addon: uses CONFIG.PUBLIC_URL if defined,
 * otherwise inferred from reverse proxy headers (e.g. x-forwarded-proto/host on Vercel) or the request.
 */
export function getBaseUrl(c: Context): string {
  if (CONFIG.PUBLIC_URL) return CONFIG.PUBLIC_URL;

  const url = new URL(c.req.url);
  const proto = (c.req.header('x-forwarded-proto') || url.protocol.replace(':', '')).split(',')[0].trim();
  const host = (c.req.header('x-forwarded-host') || c.req.header('host') || url.host).split(',')[0].trim();
  return `${proto}://${host}`;
}
