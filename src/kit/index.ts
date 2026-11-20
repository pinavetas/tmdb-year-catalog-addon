/**
 * Kit común de los addons de la familia Pina (ver docs/PINA_ADDON_KIT.md).
 *
 * Regla: nada de `src/kit/` importa código del addon. Así la carpeta se copia tal cual a un addon
 * nuevo y las mejoras se propagan copiándola de nuevo (comprobar KIT_VERSION).
 */
export * from './brand.js';
export * from './config.js';
export * from './glyph.js';
export * from './http.js';
export * from './platform.js';
export * from './stremio.js';
export * from './runtime.js';
export * from './upstream.js';
export * from './usage.js';
export * from './ui/i18n.js';
export * from './ui/components.js';
export { renderConfigurePage, type ConfigurePageOptions } from './ui/page.js';
export { CLIENT_RUNTIME, ANALYTICS_SNIPPET } from './ui/client.js';
export { PINA_CSS } from './ui/theme.js';
