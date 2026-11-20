/**
 * Segmento de configuración de usuario (`/<config>/manifest.json`), común a toda la familia.
 *
 * Estándar: JSON en base64url. Se aceptan también JSON plano y JSON codificado en URL (Nuvio y
 * clientes que reescriben la URL, como en PinaSports). Tope de tamaño (de los catálogos TMDB) para
 * no decodificar entradas absurdas. Nunca lanza: lo inválido devuelve null y el addon usa sus
 * valores por defecto.
 */

/** Tamaño máximo de un segmento de configuración (una configuración real ronda 100-400 caracteres). */
export const MAX_CONFIG_SEGMENT_LENGTH = 2048;

/** Identificador anónimo de instalación que añade /configure (solo métricas). */
export const INSTALL_ID_RE = /^[A-Za-z0-9_-]{8,40}$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Decodifica un segmento de configuración a objeto, o null si no es una configuración válida. */
export function decodeConfigSegment(
  segment: string | undefined,
  maxLength = MAX_CONFIG_SEGMENT_LENGTH
): Record<string, unknown> | null {
  if (typeof segment !== 'string' || !segment || segment.length > maxLength) return null;
  try {
    let text: string;
    if (segment.startsWith('{')) {
      text = segment;
    } else if (/^%7B/i.test(segment)) {
      text = decodeURIComponent(segment);
    } else {
      text = Buffer.from(segment, 'base64url').toString('utf8');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      // JSON plano que aún venía codificado una vez más
      parsed = JSON.parse(decodeURIComponent(text));
    }
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Codifica una configuración como segmento base64url. */
export function encodeConfigSegment(config: unknown): string {
  return Buffer.from(JSON.stringify(config), 'utf8').toString('base64url');
}

/** `installId` válido o undefined. */
export function sanitizeInstallId(value: unknown): string | undefined {
  return typeof value === 'string' && INSTALL_ID_RE.test(value) ? value : undefined;
}
