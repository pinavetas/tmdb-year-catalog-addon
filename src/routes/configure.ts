import type { Context } from 'hono';
import { requestLang } from '../kit/ui/i18n.js';
import { CONFIGURE_HTML } from '../views/configurePage.js';

/**
 * GET /configure and GET /:config/configure (served by the kit with Cache-Control: no-cache).
 *
 * Stremio opens `<addon-base-url>/configure` when clicking "Configure" on an addon with
 * `behaviorHints.configurable`. If the addon is already configured, that URL includes the
 * Base64 config segment and the web page pre-fills the form with current values.
 *
 * Language (Pina family rule): the install's `language` -> the visitor's saved choice -> Spanish
 * if the browser lists it anywhere, else English. The server sets <html lang> with the same rule
 * (minus the saved choice, which only the browser knows); the page script applies the texts.
 */
export function renderConfigure(c: Context): string {
  c.header('Vary', 'Accept-Language');
  const lang = requestLang(c.req.header('accept-language'), c.req.param('config'));
  return CONFIGURE_HTML.replace('<html lang="en">', () => `<html lang="${lang}">`);
}
