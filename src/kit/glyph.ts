import { deflateSync, crc32 } from 'node:zlib';
import { BRAND_COLORS, type Glyph, type GlyphShape } from './brand.js';

/**
 * Pinta la marca de la familia (baldosa lima inclinada + glifo negro) en SVG y en PNG.
 *
 * El PNG se genera en memoria sin dependencias (campos de distancia con antialiasing), así el logo
 * del manifiesto sale siempre del mismo glifo que la página y no hay ficheros binarios que regenerar.
 */

/** Inclinación de la baldosa (igual que `.brand-mark { transform: skewX(-8deg) }` del tema). */
const SKEW_DEG = 8;

function num(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function shapeToSvg(shape: GlyphShape): string {
  if (shape.kind === 'rect') {
    return `<rect x="${num(shape.x)}" y="${num(shape.y)}" width="${num(shape.w)}" height="${num(shape.h)}" rx="${num(shape.r ?? 0)}"/>`;
  }
  if (shape.kind === 'circle') {
    return `<circle cx="${num(shape.cx)}" cy="${num(shape.cy)}" r="${num(shape.r)}"/>`;
  }
  const d = 'M' + shape.points.map(([x, y]) => `${num(x)} ${num(y)}`).join(' L') + ' Z';
  const r = shape.r ?? 0;
  // El trazo redondeado de grosor 2r redondea las esquinas igual que el PNG (polígono + r)
  return r > 0
    ? `<path d="${d}" stroke="currentColor" stroke-width="${num(2 * r)}" stroke-linejoin="round"/>`
    : `<path d="${d}"/>`;
}

/** Glifo como SVG de 24×24 en `currentColor` (para la marca de la barra superior). */
export function glyphSvg(glyph: Glyph): string {
  return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${glyph.map(shapeToSvg).join('')}</svg>`;
}

/** Marca completa en SVG (favicon): baldosa lima inclinada + glifo. */
export function brandMarkSvg(glyph: Glyph): string {
  const scale = 40 / 24;
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    `<rect x="6" y="6" width="52" height="52" rx="13" fill="${BRAND_COLORS.accent}" transform="skewX(-${SKEW_DEG}) translate(4.5 0)"/>` +
    `<g fill="${BRAND_COLORS.ink}" color="${BRAND_COLORS.ink}" transform="translate(12 12) scale(${num(scale)})">${glyph.map(shapeToSvg).join('')}</g>` +
    '</svg>'
  );
}

// --- Rasterizado PNG ---------------------------------------------------------------------------

type Vec = [number, number];

function sdRoundRect(px: number, py: number, cx: number, cy: number, hw: number, hh: number, r: number): number {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return outside + Math.min(Math.max(qx, qy), 0) - r;
}

/** Distancia con signo a un polígono convexo o cóncavo (negativa dentro). */
function sdPolygon(px: number, py: number, pts: Vec[]): number {
  let d = Infinity;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [ax, ay] = pts[j];
    const [bx, by] = pts[i];
    const ex = bx - ax;
    const ey = by - ay;
    const wx = px - ax;
    const wy = py - ay;
    const t = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey)));
    d = Math.min(d, Math.hypot(wx - ex * t, wy - ey * t));
    if ((ay > py) !== (by > py) && px < ((bx - ax) * (py - ay)) / (by - ay) + ax) inside = !inside;
  }
  return inside ? -d : d;
}

function sdShape(px: number, py: number, shape: GlyphShape): number {
  if (shape.kind === 'rect') {
    const r = Math.min(shape.r ?? 0, shape.w / 2, shape.h / 2);
    return sdRoundRect(px, py, shape.x + shape.w / 2, shape.y + shape.h / 2, shape.w / 2, shape.h / 2, r);
  }
  if (shape.kind === 'circle') {
    return Math.hypot(px - shape.cx, py - shape.cy) - shape.r;
  }
  return sdPolygon(px, py, shape.points) - (shape.r ?? 0);
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([length, body, crc]);
}

/**
 * Logo PNG cuadrado (por defecto 256×256, el tamaño que recomienda Stremio) con fondo transparente:
 * baldosa lima inclinada con degradado y el glifo en negro.
 */
export function renderLogoPng(glyph: Glyph, size = 256): Buffer {
  const k = size / 256;
  const c = size / 2;
  const tileHalfW = 94 * k;
  const tileHalfH = 100 * k;
  const tileR = 40 * k;
  const skew = Math.tan((SKEW_DEG * Math.PI) / 180);
  // Caja 24×24 del glifo ➔ 168 px centrados (la escala de la marca de PinaSports)
  const glyphScale = (168 * k) / 24;
  const glyphOrigin = c - 12 * glyphScale;

  const light = hexToRgb(BRAND_COLORS.accentLight);
  const deep = hexToRgb(BRAND_COLORS.accentDeep);
  const ink = hexToRgb(BRAND_COLORS.ink);

  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filtro PNG «None»
    for (let x = 0; x < size; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      // Deshace la inclinación (la parte de abajo va hacia la izquierda, como skewX(-8deg))
      const ux = px - c + skew * (py - c);
      const tileD = sdRoundRect(ux, py - c, 0, 0, tileHalfW, tileHalfH, tileR);
      const tileA = Math.max(0, Math.min(1, 0.5 - tileD));
      const offset = y * stride + 1 + x * 4;
      if (tileA <= 0) continue; // transparente

      const gx = (px - glyphOrigin) / glyphScale;
      const gy = (py - glyphOrigin) / glyphScale;
      let glyphD = Infinity;
      for (const shape of glyph) glyphD = Math.min(glyphD, sdShape(gx, gy, shape));
      const glyphA = Math.max(0, Math.min(1, 0.5 - glyphD * glyphScale));

      const t = Math.max(0, Math.min(1, (x + y) / (2 * size)));
      for (let ch = 0; ch < 3; ch++) {
        const base = light[ch] + (deep[ch] - light[ch]) * t;
        raw[offset + ch] = Math.round(base + (ink[ch] - base) * glyphA);
      }
      raw[offset + 3] = Math.round(255 * tileA);
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bits por canal
  header[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}
