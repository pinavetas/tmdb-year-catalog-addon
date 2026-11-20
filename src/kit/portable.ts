/**
 * Subconjunto del kit sin Hono, para addons en JavaScript/Express (PinaSports). `npm run kit:sync`
 * lo compila a un único fichero CommonJS dentro del addon (`src/vendor/pina-kit/index.js`).
 */
export * from './brand.js';
export * from './config.js';
export * from './egress.js';
export * from './glyph.js';
export { escapeHtml, jsonForScript, normalizePublicUrl, redactPath, stripJsonExtension } from './http.js';
export * from './runtime.js';
export * from './upstream.js';
export * from './usage.js';
export * from './ui/i18n.js';
export * from './ui/components.js';
export { renderConfigurePage, type ConfigurePageOptions } from './ui/page.js';
export { CLIENT_RUNTIME, ANALYTICS_SNIPPET } from './ui/client.js';
export { PINA_CSS } from './ui/theme.js';
