import { brandName, brandWord, FAMILY, type AddonBrand } from '../brand.js';
import { glyphSvg } from '../glyph.js';
import { escapeHtml, jsonForScript } from '../http.js';
import { ANALYTICS_SNIPPET, CLIENT_RUNTIME } from './client.js';
import { createTranslator, i18nText, mergeDictionaries, type Dictionaries, type Lang, type Translator } from './i18n.js';
import { PINA_CSS } from './theme.js';

/**
 * Página de configuración común (anatomía idéntica en todos los addons de la familia):
 *
 *   barra superior (marca + EN|ES)  ·  encabezado (antetítulo, título, entradilla)
 *   ┌ contenido: avisos + secciones numeradas 01, 02… (las aporta el addon) ┐ ┌ carril ───────────┐
 *   │                                                                       │ │ Apoyo (Ko-fi)     │
 *   │                                                                       │ │ Instalación       │
 *   └───────────────────────────────────────────────────────────────────────┘ └───────────────────┘
 *   barra de instalación fija en móvil  ·  pie «Pina X · Stremio Add-on»
 *
 * El addon solo aporta sus textos (con las claves `page_title`, `hero_eyebrow`, `hero_title`
 * —HTML, con <em> para la palabra en lima— y `hero_lede`), el HTML de sus secciones y su script.
 */
export interface ConfigurePageOptions {
  brand: AddonBrand;
  version: string;
  /** Idioma inicial (detectado con la cabecera Accept-Language; el navegador puede cambiarlo). */
  lang: Lang;
  /** Textos del addon en inglés y español (se unen con los del kit). */
  strings: Dictionaries;
  /** URL pública fija (PUBLIC_URL) o '' para usar la dirección con la que se abre la página. */
  publicBaseUrl: string;
  /** Incluir Vercel Web Analytics (solo en Vercel). */
  analytics: boolean;
  /** Evitar que los buscadores indexen la página. */
  noindex?: boolean;
  /** Secciones del contenido (usar los componentes de `components.ts`). */
  main: (tr: Translator) => string;
  /** CSS adicional del addon (mejor reutilizar las clases del tema). */
  styles?: string;
  /** Script del addon (ES5, sin backticks). Debe terminar llamando a PinaKit.start(). */
  script: string;
}

const ICON_INSTALL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 20h16"/></svg>';
const ICON_WEB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/></svg>';
const ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';

function supportCard(tr: Translator): string {
  return `<section class="support-card" aria-labelledby="kitSupportTitle">
        <div class="support-header">
          <div class="support-icon" aria-hidden="true">☕</div>
          <div>
            ${i18nText(tr, 'kit_support_title', 'h3', 'class="support-title" id="kitSupportTitle"')}
            ${i18nText(tr, 'kit_support_sub', 'p', 'class="support-sub"')}
          </div>
        </div>
        <div class="support-actions">
          <a href="${FAMILY.kofiUrl}" target="_blank" rel="noopener noreferrer" class="btn-kofi" data-i18n="kit_kofi_btn">${tr.t('kit_kofi_btn')}</a>
          <a href="${FAMILY.supportHubUrl}" target="_blank" rel="noopener noreferrer" class="support-hub-link" data-i18n="kit_support_hub">${tr.t('kit_support_hub')}</a>
        </div>
      </section>`;
}

function installCard(tr: Translator): string {
  return `<section class="panel install-card" id="kitInstallPanel" aria-labelledby="kitInstallTitle">
        <div class="install-head">
          ${i18nText(tr, 'kit_install_eyebrow', 'p', 'class="eyebrow"')}
          ${i18nText(tr, 'kit_install_title', 'h2', 'id="kitInstallTitle"')}
        </div>
        <ul class="summary" id="kitSummary"></ul>
        <div class="install-actions">
          <a href="#" id="kitInstallBtn" class="btn btn-primary btn-lg btn-block">${ICON_INSTALL}${i18nText(tr, 'kit_install_btn')}</a>
          <a href="#" id="kitWebBtn" target="_blank" rel="noopener" class="btn btn-block">${ICON_WEB}${i18nText(tr, 'kit_install_web')}</a>
          <button type="button" id="kitCopyBtn" class="btn btn-block">${ICON_COPY}${i18nText(tr, 'kit_copy', 'span', 'id="kitCopyLabel"')}</button>
          <p class="status" id="kitStatus" role="status" aria-live="polite"></p>
          <div class="field">
            ${i18nText(tr, 'kit_manifest_label', 'label', 'for="kitManifestUrl"')}
            <input type="text" id="kitManifestUrl" class="mono-field" readonly spellcheck="false" autocomplete="off">
            ${i18nText(tr, 'kit_manifest_hint', 'p', 'class="hint"')}
          </div>
          <details class="disclosure">
            ${i18nText(tr, 'kit_tv_title', 'summary')}
            <div class="disclosure-body"><ol data-i18n-html="kit_tv_steps">${tr.html('kit_tv_steps')}</ol></div>
          </details>
        </div>
      </section>`;
}

export function renderConfigurePage(options: ConfigurePageOptions): string {
  const name = brandName(options.brand);
  const dictionaries = mergeDictionaries(options.strings, { name });
  const tr = createTranslator(dictionaries, options.lang);
  const boot = {
    lang: options.lang,
    i18n: dictionaries,
    publicBaseUrl: options.publicBaseUrl
  };

  return `<!DOCTYPE html>
<html lang="${options.lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#0a0c0f">${options.noindex ? '\n  <meta name="robots" content="noindex, nofollow">' : ''}
  <title>${tr.t('page_title')}</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${PINA_CSS}${options.styles || ''}</style>${options.analytics ? '\n  ' + ANALYTICS_SNIPPET : ''}
</head>
<body>
  <header class="topbar">
    <a class="brand" href="/configure" aria-label="${escapeHtml(brandWord(options.brand))}">
      <span class="brand-mark">${glyphSvg(options.brand.glyph)}</span>
      <span class="brand-word">${FAMILY.prefix}<b>${escapeHtml(options.brand.product)}</b></span>
    </a>
    <span class="spacer"></span>
    <div class="lang-switcher" role="group" aria-label="${tr.t('kit_lang_group')}" data-i18n-aria="kit_lang_group">
      <button type="button" class="lang-btn" data-lang="en" aria-pressed="${options.lang === 'en'}">EN</button>
      <button type="button" class="lang-btn" data-lang="es" aria-pressed="${options.lang === 'es'}">ES</button>
    </div>
    ${i18nText(tr, 'kit_topbar_meta', 'span', 'class="topbar-meta"')}
  </header>

  <section class="hero pitch-bg">
    <div class="hero-inner">
      ${i18nText(tr, 'hero_eyebrow', 'p', 'class="eyebrow"')}
      <h1 data-i18n-html="hero_title">${tr.html('hero_title')}</h1>
      ${i18nText(tr, 'hero_lede', 'p', 'class="lede"')}
    </div>
  </section>

  <div class="setup">
    <main class="setup-main">
      <div class="notices" id="kitNotices" hidden>
        <div class="notice notice-warn" id="kitWarnHttps" hidden><span aria-hidden="true">⚠️</span>${i18nText(tr, 'kit_warn_https')}</div>
        <div class="notice notice-warn" id="kitWarnLoopback" hidden><span aria-hidden="true">⚠️</span>${i18nText(tr, 'kit_warn_loopback')}</div>
      </div>
      ${options.main(tr)}
    </main>

    <aside class="setup-rail">
      ${supportCard(tr)}
      ${installCard(tr)}
    </aside>
  </div>

  <div class="install-dock" id="kitDock" aria-hidden="true">
    <span class="dock-text" id="kitDockText"></span>
    <a href="#" id="kitDockInstall" class="btn btn-primary" tabindex="-1" data-i18n="kit_dock_install">${tr.t('kit_dock_install')}</a>
  </div>

  <footer class="site-foot">
    ${i18nText(tr, 'kit_footer')}
    <span>v${escapeHtml(options.version)} · <a href="${FAMILY.kofiUrl}" target="_blank" rel="noopener noreferrer">Ko-fi</a> · <a href="${FAMILY.supportHubUrl}" target="_blank" rel="noopener noreferrer">pinadev</a></span>
  </footer>

  <script>window.PINA_BOOT = ${jsonForScript(boot)};</script>
  <script>${CLIENT_RUNTIME}</script>
  <script>${options.script}</script>
</body>
</html>`;
}
