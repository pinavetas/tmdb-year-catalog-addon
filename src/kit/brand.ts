/**
 * Identidad de la familia Pina (addons de Stremio/Nuvio/Alder de pinadev).
 *
 * Todo addon de la familia comparte: prefijo «Pina» + producto en el nombre, marca lima inclinada
 * con un glifo negro propio, el mismo sistema visual, la tarjeta de apoyo (Ko-fi) y las métricas.
 * Lo único que cambia de un addon a otro es su `AddonBrand` (nombre, glifo y textos), que vive
 * fuera del kit (en este repo, `src/brand.ts`).
 *
 * Ver docs/PINA_ADDON_KIT.md.
 */

/** Versión del kit. Súbela al cambiar cualquier fichero de `src/kit/` y copia la carpeta entera a los demás addons. */
export const KIT_VERSION = '1.1.0';

/** Enlaces comunes a toda la familia. */
export const FAMILY = {
  /** Prefijo de todos los nombres («Pina» + producto). No es una piña: no usar frutas ni su logo. */
  prefix: 'Pina',
  kofiUrl: 'https://ko-fi.com/pinadev',
  supportHubUrl: 'https://pinadev-web.vercel.app/support'
} as const;

/** Colores de la marca (iguales que los tokens --accent / --accent-ink del tema). */
export const BRAND_COLORS = {
  accent: '#c6ff3d',
  accentLight: '#d4ff6b',
  accentDeep: '#b2ee1e',
  ink: '#0a0c0f'
} as const;

/**
 * Glifo de un addon, en una caja de 24×24 (como un icono SVG). Se dibuja en negro sobre la baldosa
 * lima: en la barra superior de las páginas, en el favicon y en el logo PNG del manifiesto.
 * Con primitivas simples, el mismo glifo se puede pintar en SVG y rasterizar a PNG sin dependencias.
 */
export type GlyphShape =
  /** Polígono (triángulo de «play», flechas…) con las esquinas redondeadas `r` (crece `r` hacia fuera). */
  | { kind: 'polygon'; points: Array<[number, number]>; r?: number }
  /** Rectángulo redondeado (barras, pantallas…). */
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r?: number }
  | { kind: 'circle'; cx: number; cy: number; r: number };

export type Glyph = GlyphShape[];

export interface AddonBrand {
  /** Producto tras el prefijo: «Streams» ➔ PinaStreams / Pina Streams. */
  product: string;
  /** Glifo propio del addon (ver `Glyph`). */
  glyph: Glyph;
}

/** «PinaStreams»: marca de palabra (cabecera de la página). */
export function brandWord(brand: AddonBrand): string {
  return FAMILY.prefix + brand.product;
}

/** «Pina Streams»: nombre legible (manifiesto, títulos, pie). */
export function brandName(brand: AddonBrand): string {
  return FAMILY.prefix + ' ' + brand.product;
}
