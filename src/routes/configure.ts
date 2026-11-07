import type { Context } from 'hono';
import { CONFIGURE_HTML } from '../views/configurePage.js';

/**
 * GET /configure y GET /:config/configure
 *
 * Stremio abre `<url-base-del-addon>/configure` al pulsar "Configurar" sobre un addon con
 * `behaviorHints.configurable`; si el addon ya está configurado, esa URL incluye el segmento
 * Base64 y la página lo usa para rellenar el formulario.
 */
export function handleConfigure(c: Context): Response {
  c.header('Cache-Control', 'public, max-age=3600');
  return c.html(CONFIGURE_HTML);
}
