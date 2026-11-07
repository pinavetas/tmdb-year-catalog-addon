export interface AddonUserConfig {
  /** Clave API v3 (32 caracteres hex) o token de lectura v4 (JWT) de TMDB */
  tmdbApiKey?: string;
  minVotesMovie?: number;
  minVotesSeries?: number;
  enableMovies?: boolean;
  enableSeries?: boolean;
  /** Catálogos de búsqueda en lenguaje natural ("2023 8+", "dune 2024") */
  enableSearch?: boolean;
  enableTopMovies8?: boolean;
  enableTopSeries8?: boolean;
  enableRecentReleases?: boolean;
}

/**
 * Valores por defecto. `minVotesMovie`/`minVotesSeries` se dejan sin definir a propósito para que,
 * si el usuario no los personaliza, se apliquen DEFAULT_MIN_VOTES_* del entorno del servidor.
 */
export const DEFAULT_USER_CONFIG: Readonly<AddonUserConfig> = Object.freeze({
  enableMovies: true,
  enableSeries: true,
  enableSearch: true,
  enableTopMovies8: false,
  enableTopSeries8: false,
  enableRecentReleases: false
});

/** Longitud máxima aceptada para el segmento de configuración de la URL */
const MAX_CONFIG_LENGTH = 2048;

/** Clave v3 (alfanumérica) o token v4 (JWT: base64url separados por puntos) */
const TMDB_KEY_PATTERN = /^[A-Za-z0-9_.-]{16,1024}$/;

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

    const minVotesMovie = readClampedInt(raw.minVotesMovie, 1, 5000);
    if (minVotesMovie !== undefined) config.minVotesMovie = minVotesMovie;
    const minVotesSeries = readClampedInt(raw.minVotesSeries, 1, 2000);
    if (minVotesSeries !== undefined) config.minVotesSeries = minVotesSeries;

    config.enableMovies = readBoolean(raw.enableMovies, defaults.enableMovies!);
    config.enableSeries = readBoolean(raw.enableSeries, defaults.enableSeries!);
    config.enableSearch = readBoolean(raw.enableSearch, defaults.enableSearch!);
    config.enableTopMovies8 = readBoolean(raw.enableTopMovies8, defaults.enableTopMovies8!);
    config.enableTopSeries8 = readBoolean(raw.enableTopSeries8, defaults.enableTopSeries8!);
    config.enableRecentReleases = readBoolean(raw.enableRecentReleases, defaults.enableRecentReleases!);

    return config;
  } catch {
    return defaults;
  }
}
