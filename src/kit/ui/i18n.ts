import { escapeHtml } from '../http.js';

/**
 * Idiomas de la familia: inglés y español. Regla común a todos los addons (por orden):
 *   1. el idioma guardado en la configuración de la instalación (`lang`, al reconfigurar);
 *   2. la elección manual del navegador (botones EN | ES, localStorage `pina_lang`; solo cliente);
 *   3. los idiomas del navegador: español si aparece en cualquier posición; si no, inglés.
 * La página guarda el idioma elegido en la configuración (`lang`) y el manifiesto de cada
 * instalación sale en ese idioma (sin `lang`, en inglés).
 */
export type Lang = 'en' | 'es';
export const LANGS: readonly Lang[] = ['en', 'es'];

export type Dictionary = Record<string, string>;
export type Dictionaries = Record<Lang, Dictionary>;

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'es';
}

/** Idiomas del navegador (servidor: cabecera Accept-Language; cliente: navigator.languages). */
export function detectLang(acceptLanguage: string | undefined): Lang {
  const tags = (acceptLanguage || '').split(',').map((part) => part.split(';')[0].trim().toLowerCase());
  return tags.some((tag) => tag.startsWith('es')) ? 'es' : 'en';
}

/** Idioma guardado en un segmento de configuración (`lang`, o `language` en los catálogos TMDB). */
export function langFromConfigSegment(segment: string | undefined): Lang | undefined {
  if (!segment) return undefined;
  try {
    const text = segment.startsWith('{') || /^%7B/i.test(segment)
      ? decodeURIComponent(segment)
      : Buffer.from(segment, 'base64url').toString('utf8');
    const parsed = JSON.parse(text) as { lang?: unknown; language?: unknown };
    const lang = parsed?.lang ?? parsed?.language;
    return isLang(lang) ? lang : undefined;
  } catch {
    return undefined;
  }
}

/** Idioma inicial de una página en el servidor: el de la configuración y, si no, el del navegador. */
export function requestLang(acceptLanguage: string | undefined, configSegment?: string): Lang {
  return langFromConfigSegment(configSegment) ?? detectLang(acceptLanguage);
}

/**
 * Textos comunes a todos los addons (barra superior, avisos, apoyo, instalación y pie).
 * Las claves del kit empiezan por `kit_`; las del addon no deben usar ese prefijo.
 * `{name}` se sustituye por el nombre del addon («Pina Streams»).
 */
export const KIT_STRINGS: Dictionaries = {
  en: {
    kit_lang_group: 'Language',
    kit_topbar_meta: 'Stremio add-on',
    kit_warn_https: 'You are using plain HTTP from another address. Stremio only installs add-ons over HTTPS (except http://127.0.0.1 on the same device), so this link will fail on your TV. Open this page from the HTTPS address of the add-on.',
    kit_warn_loopback: 'You opened this page as localhost. The generated link only works on this same device: installed on your Stremio account, the TV would try to connect to itself. For the TV, open this page from the public HTTPS address.',
    kit_support_title: 'Support the Add-on',
    kit_support_sub: 'Help keep servers and sources online, fast and free.',
    kit_kofi_btn: '☕ Buy me a coffee on Ko-fi',
    kit_support_hub: 'More ways to support & projects →',
    kit_install_eyebrow: 'Ready to install',
    kit_install_title: 'Your Add-on',
    kit_install_btn: 'Install in Stremio',
    kit_install_web: 'Open in Stremio Web',
    kit_copy: 'Copy manifest link',
    kit_copied: 'Copied!',
    kit_copy_failed: 'Copy failed',
    kit_status_ok: 'Link copied to clipboard.',
    kit_status_err: 'Copy blocked. Select and copy the link manually.',
    kit_fix_first: 'Fix the highlighted setting before installing.',
    kit_manifest_label: 'Manifest link',
    kit_manifest_hint: 'Install opens the Stremio app. For Nuvio and other apps, paste this link into their add-on box. Alder syncs through your Stremio account.',
    kit_tv_title: 'Watching on TV',
    kit_tv_steps: '<li>Install it from your phone or PC with <strong>Install in Stremio</strong> or <strong>Open in Stremio Web</strong>, using the <strong>same account</strong> as on the TV.</li><li>Open Stremio on the TV: the add-on shows up by itself (if not, log out and back in).</li><li><strong>Nuvio</strong>: Settings ➔ Addons ➔ paste the manifest link.</li>',
    kit_dock_install: 'Install',
    kit_all: 'All',
    kit_none: 'None',
    kit_optional: 'Optional',
    kit_less: 'Fewer',
    kit_more: 'More',
    kit_footer: '{name} · Stremio Add-on'
  },
  es: {
    kit_lang_group: 'Idioma',
    kit_topbar_meta: 'Add-on de Stremio',
    kit_warn_https: 'Estás usando HTTP desde otra dirección. Stremio solo instala add-ons por HTTPS (salvo http://127.0.0.1 en el mismo equipo), así que en la TV este enlace fallará. Abre esta página desde la dirección HTTPS del add-on.',
    kit_warn_loopback: 'Has abierto esta página como localhost. El enlace generado solo funciona en este mismo equipo: instalado en tu cuenta de Stremio, la TV intentaría conectarse a sí misma. Para la TV, abre esta página desde la dirección HTTPS pública.',
    kit_support_title: 'Apoya el Add-on',
    kit_support_sub: 'Ayuda a mantener los servidores y las fuentes en línea, rápidos y gratis.',
    kit_kofi_btn: '☕ Invítame a un café en Ko-fi',
    kit_support_hub: 'Más formas de colaborar y proyectos →',
    kit_install_eyebrow: 'Listo para instalar',
    kit_install_title: 'Tu Add-on',
    kit_install_btn: 'Instalar en Stremio',
    kit_install_web: 'Abrir en Stremio Web',
    kit_copy: 'Copiar enlace del manifiesto',
    kit_copied: '¡Copiado!',
    kit_copy_failed: 'Error al copiar',
    kit_status_ok: 'Enlace copiado al portapapeles.',
    kit_status_err: 'Copia bloqueada. Selecciona y copia el enlace manualmente.',
    kit_fix_first: 'Corrige el ajuste marcado antes de instalar.',
    kit_manifest_label: 'Enlace del manifiesto',
    kit_manifest_hint: 'Instalar abre la app de Stremio. En Nuvio y otras apps, pega este enlace en su buscador de add-ons. Alder se sincroniza con tu cuenta de Stremio.',
    kit_tv_title: 'Para verlo en la TV',
    kit_tv_steps: '<li>Instálalo desde el móvil o el PC con <strong>Instalar en Stremio</strong> o <strong>Abrir en Stremio Web</strong>, con la <strong>misma cuenta</strong> que usas en la TV.</li><li>Abre Stremio en la TV: el add-on aparece solo (si no, cierra sesión y vuelve a entrar).</li><li><strong>Nuvio</strong>: Settings ➔ Addons ➔ pega el enlace del manifiesto.</li>',
    kit_dock_install: 'Instalar',
    kit_all: 'Todas',
    kit_none: 'Ninguna',
    kit_optional: 'Opcional',
    kit_less: 'Menos',
    kit_more: 'Más',
    kit_footer: '{name} · Add-on para Stremio'
  }
};

/** Une los textos del kit con los del addon (los del addon no pueden pisar claves `kit_`). */
export function mergeDictionaries(addon: Dictionaries, vars: Record<string, string> = {}): Dictionaries {
  const result = {} as Dictionaries;
  for (const lang of LANGS) {
    const merged: Dictionary = { ...addon[lang], ...KIT_STRINGS[lang] };
    for (const key of Object.keys(merged)) {
      merged[key] = merged[key].replace(/\{(\w+)\}/g, (match, name: string) => vars[name] ?? match);
    }
    result[lang] = merged;
  }
  return result;
}

/** Traductor del servidor: pinta la página ya en el idioma detectado (sin parpadeo al cargar). */
export interface Translator {
  lang: Lang;
  /** Texto escapado, para nodos de texto y atributos. */
  t(key: string): string;
  /** HTML de confianza (solo textos propios del diccionario, nunca datos del usuario). */
  html(key: string): string;
}

export function createTranslator(dictionaries: Dictionaries, lang: Lang): Translator {
  const lookup = (key: string) => dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
  return {
    lang,
    t: (key) => escapeHtml(lookup(key)),
    html: (key) => lookup(key)
  };
}

/** Texto traducible: `<tag data-i18n="key">texto</tag>` (el navegador lo cambia al cambiar de idioma). */
export function i18nText(tr: Translator, key: string, tag = 'span', attrs = ''): string {
  return `<${tag}${attrs ? ' ' + attrs : ''} data-i18n="${key}">${tr.t(key)}</${tag}>`;
}
