export interface AddonUserConfig {
  /** Clave API v3 (32 caracteres hex) o token de lectura v4 (JWT) de TMDB */
  tmdbApiKey?: string;
  /** Clave de API de RPDB (Rating Poster Database) para ver notas en los pósters (opcional) */
  rpdbKey?: string;
  /** Idioma del catálogo y metadatos ('en' o 'es') */
  language?: 'en' | 'es';
  /** Regiones seleccionadas ('spain', 'europe', 'us', 'latam', 'asia') */
  regions?: string[];
  /** Puntuación mínima de IMDb (ej: 7.0, 7.5, 8.0, o 0 para desactivar) */
  minRating?: number;
  minVotesMovie?: number;
  minVotesSeries?: number;
  enableMovies?: boolean;
  enableSeries?: boolean;
  /** Catálogos de búsqueda en lenguaje natural ("2023 8+", "dune 2024") */
  enableSearch?: boolean;
}

/**
 * Valores por defecto. `minVotesMovie`/`minVotesSeries` se dejan sin definir a propósito para que,
 * si el usuario no los personaliza, se apliquen DEFAULT_MIN_VOTES_* del entorno del servidor.
 */
export const DEFAULT_USER_CONFIG: Readonly<AddonUserConfig> = Object.freeze({
  language: 'en',
  regions: ['europe', 'us', 'latam'],
  minRating: 7.0,
  enableMovies: true,
  enableSeries: true,
  enableSearch: true
});

/** Longitud máxima aceptada para el segmento de configuración de la URL */
const MAX_CONFIG_LENGTH = 2048;

/** Clave v3 (alfanumérica) o token v4 (JWT: base64url separados por puntos) */
const TMDB_KEY_PATTERN = /^[A-Za-z0-9_.-]{16,1024}$/;

const VALID_REGIONS = new Set(['spain', 'europe', 'us', 'latam', 'asia']);

/**
 * Codifica la configuración en Base64 seguro para URLs.
 *
 * IMPORTANTE: Base64 NO es encriptación. Si el usuario proporciona su propia
 * API key de TMDB, esta será visible en la URL del manifiesto. Esto es una
 * limitación inherente al protocolo de addons de Stremio, que requiere que
 * la configuración viaje en la URL.
 */
export function encodeConfig(config: AddonUserConfig): string {
  return Buffer.from(JSON.stringify(config)).toString('base64url');
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function readClampedInt(value: unknown, min: number, max: number): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? Math.min(max, Math.max(min, Math.round(num))) : undefined;
}

function readClampedFloat(value: unknown, min: number, max: number): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? Math.min(max, Math.max(min, Math.round(num * 10) / 10)) : undefined;
}

/**
 * Decodifica una cadena Base64 (base64url o estándar) a configuración de usuario,
 * con validación y valores por defecto seguros ante cualquier entrada inválida.
 */
export function decodeConfig(configStr?: string): AddonUserConfig {
  const defaults: AddonUserConfig = { ...DEFAULT_USER_CONFIG };
  if (!configStr || configStr.length > MAX_CONFIG_LENGTH) return defaults;

  try {
    // Buffer acepta tanto el alfabeto base64url como el estándar (+ /)
    const json = Buffer.from(configStr, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(json);

    // Rechazar si no es un objeto plano
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return defaults;
    }
    const raw = parsed as Record<string, unknown>;
    const config: AddonUserConfig = { ...defaults };

    if (typeof raw.tmdbApiKey === 'string') {
      const key = raw.tmdbApiKey.trim();
      if (TMDB_KEY_PATTERN.test(key)) config.tmdbApiKey = key;
    }

    if (typeof raw.rpdbKey === 'string') {
      const rpdb = raw.rpdbKey.trim();
      if (/^[A-Za-z0-9_.-]{3,128}$/.test(rpdb)) config.rpdbKey = rpdb;
    }

    if (raw.language === 'es' || raw.language === 'en') {
      config.language = raw.language;
    }

    if (Array.isArray(raw.regions)) {
      config.regions = raw.regions.filter((r): r is string => typeof r === 'string' && VALID_REGIONS.has(r));
    }

    const minRating = readClampedFloat(raw.minRating, 0, 10);
    if (minRating !== undefined) config.minRating = minRating;

    const minVotesMovie = readClampedInt(raw.minVotesMovie, 1, 5000);
    if (minVotesMovie !== undefined) config.minVotesMovie = minVotesMovie;
    const minVotesSeries = readClampedInt(raw.minVotesSeries, 1, 2000);
    if (minVotesSeries !== undefined) config.minVotesSeries = minVotesSeries;

    config.enableMovies = readBoolean(raw.enableMovies, defaults.enableMovies!);
    config.enableSeries = readBoolean(raw.enableSeries, defaults.enableSeries!);
    config.enableSearch = readBoolean(raw.enableSearch, defaults.enableSearch!);

    return config;
  } catch {
    return defaults;
  }
}
