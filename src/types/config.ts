export interface AddonUserConfig {
  /** TMDB v3 API Key (32 hex characters) or v4 Read Access Token (JWT) */
  tmdbApiKey?: string;
  /** RPDB (Rating Poster Database) API Key to display rating badges on posters (optional) */
  rpdbKey?: string;
  /** Catalog language and metadata ('en' or 'es') */
  language?: 'en' | 'es';
  /** Selected production regions ('spain', 'europe', 'us', 'latam', 'asia') */
  regions?: string[];
  /** Minimum TMDB score (e.g., 7.0, 7.5, 8.0, or 0 to disable) */
  minRating?: number;
  minVotesMovie?: number;
  minVotesSeries?: number;
  enableMovies?: boolean;
  enableSeries?: boolean;
  /** Smart natural language search catalogs ("2023 8+", "dune 2024") */
  enableSearch?: boolean;
}

/**
 * Default values. `minVotesMovie`/`minVotesSeries` are deliberately left undefined
 * so server environment DEFAULT_MIN_VOTES_* values apply unless customized by the user.
 */
export const DEFAULT_USER_CONFIG: Readonly<AddonUserConfig> = Object.freeze({
  language: 'en',
  regions: ['europe', 'us', 'latam'],
  minRating: 7.0,
  enableMovies: true,
  enableSeries: true,
  enableSearch: true
});

/** Maximum length accepted for the configuration segment in URL */
const MAX_CONFIG_LENGTH = 2048;

/** TMDB v3 key (alphanumeric) or v4 token (JWT: base64url segments separated by dots) */
const TMDB_KEY_PATTERN = /^[A-Za-z0-9_.-]{16,1024}$/;

const VALID_REGIONS = new Set(['spain', 'europe', 'us', 'latam', 'asia']);

/**
 * Encodes configuration into URL-safe Base64.
 *
 * NOTE: Base64 is not encryption. The TMDB API key travels encoded in the URL,
 * which is an inherent requirement of the Stremio Addon Protocol.
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
 * Decodes a Base64 string (base64url or standard) into user configuration,
 * with validation and safe defaults against invalid inputs.
 */
export function decodeConfig(configStr?: string): AddonUserConfig {
  const defaults: AddonUserConfig = { ...DEFAULT_USER_CONFIG };
  if (!configStr || configStr.length > MAX_CONFIG_LENGTH) return defaults;

  try {
    const json = Buffer.from(configStr, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(json);

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
