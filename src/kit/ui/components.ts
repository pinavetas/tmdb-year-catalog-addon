import { escapeHtml } from '../http.js';
import { i18nText, type Translator } from './i18n.js';

/**
 * Piezas de las secciones de configuración. Todas reciben claves del diccionario (no textos), así
 * la página sale ya traducida del servidor y el navegador puede cambiar de idioma sin recargar.
 * Los `id`/`name` los elige el addon y su script los lee.
 */

export interface PanelOptions {
  /** «01», «02»… en el orden de la página. */
  index: string;
  id: string;
  titleKey: string;
  subKey?: string;
  /** HTML a la derecha del título (p. ej. `tileTools`). */
  tools?: string;
  body: string;
}

/** Sección numerada (panel). */
export function panel(tr: Translator, o: PanelOptions): string {
  return `<section class="panel" aria-labelledby="${o.id}">
        <div class="section-head">
          <div>
            <div class="section-title"><span class="section-index">${escapeHtml(o.index)}</span>${i18nText(tr, o.titleKey, 'h2', `id="${o.id}"`)}</div>
            ${o.subKey ? i18nText(tr, o.subKey, 'p', 'class="section-sub"') : ''}
          </div>
          ${o.tools ? `<div class="section-tools">${o.tools}</div>` : ''}
        </div>
        ${o.body}
      </section>`;
}

/** Contador «n/total» + botones Todas/Ninguna para una rejilla de baldosas (ver PinaKit.bindTiles). */
export function tileTools(tr: Translator, o: { counterId: string; allId: string; noneId: string }): string {
  return `<span class="counter" id="${o.counterId}"></span>
            <div class="mini-actions" role="group">
              <button type="button" id="${o.allId}" data-i18n="kit_all">${tr.t('kit_all')}</button>
              <button type="button" id="${o.noneId}" data-i18n="kit_none">${tr.t('kit_none')}</button>
            </div>`;
}

export interface TileOptions {
  value: string;
  labelKey: string;
  subKey?: string;
  /** Icono: SVG de confianza o 2-3 letras (monograma). */
  icon: string;
  checked: boolean;
}

/** Baldosa activable (checkbox). Las marcadas por defecto son las recomendadas. */
export function tile(tr: Translator, o: TileOptions): string {
  const icon = o.icon.startsWith('<svg') ? o.icon : escapeHtml(o.icon);
  return `<label class="tile${o.checked ? ' is-on' : ''}"><input type="checkbox" value="${escapeHtml(o.value)}"${o.checked ? ' checked' : ''}><span class="tile-ico" aria-hidden="true">${icon}</span><span class="tile-text">${i18nText(tr, o.labelKey, 'span', 'class="tile-label"')}${o.subKey ? i18nText(tr, o.subKey, 'span', 'class="tile-sub"') : ''}</span><span class="tile-check" aria-hidden="true"></span></label>`;
}

export function tileGrid(id: string, tiles: string[]): string {
  return `<div class="tile-grid" id="${id}">${tiles.join('')}</div>`;
}

export interface SegmentedOptions {
  name: string;
  labelKey: string;
  hintKey?: string;
  options: Array<{ value: string; labelKey?: string; label?: string }>;
  value: string;
}

/** Una opción entre varias (radio). */
export function segmented(tr: Translator, o: SegmentedOptions): string {
  const labelId = `lbl_${o.name}`;
  const items = o.options
    .map((opt) => {
      const text = opt.labelKey ? i18nText(tr, opt.labelKey) : `<span>${escapeHtml(opt.label || opt.value)}</span>`;
      return `<label><input type="radio" name="${o.name}" value="${escapeHtml(opt.value)}"${opt.value === o.value ? ' checked' : ''}>${text}</label>`;
    })
    .join('');
  return `<div class="field">
          ${i18nText(tr, o.labelKey, 'div', `class="field-label" id="${labelId}"`)}
          <div class="segmented" role="radiogroup" aria-labelledby="${labelId}">${items}</div>
          ${o.hintKey ? i18nText(tr, o.hintKey, 'p', 'class="hint"') : ''}
        </div>`;
}

/** Interruptor sí/no con título y explicación. */
export function toggle(tr: Translator, o: { id: string; titleKey: string; hintKey?: string; checked: boolean }): string {
  return `<label class="toggle" for="${o.id}">
          <span>${i18nText(tr, o.titleKey, 'span', 'class="toggle-title"')}${o.hintKey ? i18nText(tr, o.hintKey, 'span', 'class="hint"') : ''}</span>
          <input type="checkbox" class="switch" id="${o.id}"${o.checked ? ' checked' : ''}>
        </label>`;
}

/** Selector numérico − n +. El script del addon enlaza los botones `${id}Minus` / `${id}Plus`. */
export function stepper(tr: Translator, o: { id: string; labelKey: string; hintKey?: string; value: number; min: number; max: number }): string {
  return `<div class="field">
          ${i18nText(tr, o.labelKey, 'label', `for="${o.id}"`)}
          <div class="stepper">
            <button type="button" id="${o.id}Minus" aria-label="${tr.t('kit_less')}" data-i18n-aria="kit_less">−</button>
            <input type="number" id="${o.id}" value="${o.value}" min="${o.min}" max="${o.max}" inputmode="numeric">
            <button type="button" id="${o.id}Plus" aria-label="${tr.t('kit_more')}" data-i18n-aria="kit_more">+</button>
          </div>
          ${o.hintKey ? i18nText(tr, o.hintKey, 'p', 'class="hint"') : ''}
        </div>`;
}

/** Desplegable con texto de ayuda (HTML de confianza del diccionario). */
export function disclosure(tr: Translator, o: { summaryKey: string; bodyKey: string; list?: 'ol' | 'ul' }): string {
  const body = o.list
    ? `<${o.list} data-i18n-html="${o.bodyKey}">${tr.html(o.bodyKey)}</${o.list}>`
    : `<p data-i18n-html="${o.bodyKey}">${tr.html(o.bodyKey)}</p>`;
  return `<details class="disclosure">
          ${i18nText(tr, o.summaryKey, 'summary')}
          <div class="disclosure-body">${body}</div>
        </details>`;
}

/** Etiqueta de grupo con línea («Fuentes de respaldo ———»). */
export function groupLabel(tr: Translator, key: string): string {
  return i18nText(tr, key, 'p', 'class="group-label"');
}
