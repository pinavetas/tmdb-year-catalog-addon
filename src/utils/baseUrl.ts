import type { Context } from 'hono';
import { CONFIG } from '../config.js';
import { getBaseUrl as kitGetBaseUrl } from '../kit/http.js';

/**
 * Public base URL of the addon: CONFIG.PUBLIC_URL if defined, otherwise inferred from reverse
 * proxy headers (x-forwarded-proto/host on Vercel) or the request (shared kit).
 */
export function getBaseUrl(c: Context): string {
  return kitGetBaseUrl(c, CONFIG.PUBLIC_URL);
}
