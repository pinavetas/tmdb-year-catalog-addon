import type { Context } from 'hono';
import { CONFIGURE_HTML } from '../views/configurePage.js';

/**
 * GET /configure and GET /:config/configure
 *
 * Stremio opens `<addon-base-url>/configure` when clicking "Configure" on an addon with
 * `behaviorHints.configurable`. If the addon is already configured, that URL includes the
 * Base64 config segment and the web page pre-fills the form with current values.
 */
export function handleConfigure(c: Context): Response {
  c.header('Cache-Control', 'public, max-age=3600');
  return c.html(CONFIGURE_HTML);
}
