// Load local `.env` with native Node support (no dependencies).
// Environment variables take precedence. In Vercel `.env` does not exist and is ignored.
try {
  process.loadEnvFile();
} catch {
  // No .env file: use environment variables only
}

function intFromEnv(name: string, fallback: number): number {
  const parsed = parseInt(process.env[name] || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Normalizes PUBLIC_URL by removing trailing slashes (prevents `https://x.com//logo.png`). */
function normalizePublicUrl(value: string | undefined): string {
  return (value || '').trim().replace(/\/+$/, '');
}

/** First year with an individual entry in the year dropdown (earlier years are grouped in ranges). */
const FIRST_INDIVIDUAL_YEAR = 2020;

/**
 * Year catalog options (no emojis to maintain clean native Stremio UI styling).
 * Individual years are dynamically generated from current year down to 2020.
 */
export function buildYearOptions(currentYear = new Date().getFullYear(), language: 'en' | 'es' = 'en'): string[] {
  const years: string[] = [];
  for (let y = currentYear; y >= FIRST_INDIVIDUAL_YEAR; y--) {
    years.push(String(y));
  }
  const ranges = language === 'es'
    ? [
        '2015 - 2019',
        '2010 - 2014',
        'Década 2000',
        'Años 90',
        'Años 80',
        'Años 70',
        'Clásicos (<1970)'
      ]
    : [
        '2015 - 2019',
        '2010 - 2014',
        '2000s',
        '90s',
        '80s',
        '70s',
        'Classics (<1970)'
      ];
  return [...years, ...ranges];
}

export const REGIONS: Record<string, { label: string; countries: string[] }> = {
  europe: {
    label: '🇪🇺 Europe',
    countries: ['ES', 'GB', 'FR', 'IT', 'DE', 'SE', 'DK', 'NO', 'FI', 'NL', 'BE', 'IE', 'PL', 'PT', 'AT', 'CH']
  },
  spain: {
    label: '🇪🇸 Spain',
    countries: ['ES']
  },
  us: {
    label: '🇺🇸 United States / Hollywood',
    countries: ['US']
  },
  latam: {
    label: '🌎 Latin America',
    countries: ['AR', 'MX', 'BR', 'CO', 'CL', 'UY', 'PE']
  },
  asia: {
    label: '🌏 Asia',
    countries: ['JP', 'KR', 'CN', 'HK', 'TW', 'IN']
  }
};

/** Resolves the list of unique country codes from selected regions. */
export function resolveCountriesFromRegions(regions?: string[]): string[] | undefined {
  if (!regions || regions.length === 0) return undefined;
  const set = new Set<string>();
  for (const r of regions) {
    const reg = REGIONS[r];
    if (reg) {
      for (const c of reg.countries) set.add(c);
    }
  }
  return set.size > 0 ? Array.from(set) : undefined;
}

export const CONFIG = {
  PORT: intFromEnv('PORT', 7000),
  HOST: process.env.HOST || '0.0.0.0',
  PUBLIC_URL: normalizePublicUrl(process.env.PUBLIC_URL),
  TMDB_API_KEY: (process.env.TMDB_API_KEY || '').trim(),
  DEFAULT_MIN_VOTES_MOVIE: intFromEnv('DEFAULT_MIN_VOTES_MOVIE', 200),
  DEFAULT_MIN_VOTES_SERIES: intFromEnv('DEFAULT_MIN_VOTES_SERIES', 50),
  /** Default language for titles and overviews from TMDB */
  TMDB_LANGUAGE: process.env.TMDB_LANGUAGE || 'en-US',

  // In-memory cache TTLs (milliseconds)
  CACHE_TTL_CATALOG_MS: 6 * 60 * 60 * 1000, // 6 hours
  CACHE_TTL_IDS_MS: 7 * 24 * 60 * 60 * 1000, // 7 days

  // HTTP cache TTLs (seconds). `s-maxage` is used by Vercel Edge CDN and shared proxies.
  HTTP_CACHE_CATALOG_CLIENT_S: 30 * 60, // 30 min client
  HTTP_CACHE_CATALOG_CDN_S: 6 * 60 * 60, // 6 hours CDN
  HTTP_CACHE_STALE_S: 24 * 60 * 60, // serve stale content while revalidating
  HTTP_CACHE_EMPTY_S: 5 * 60, // legitimate empty results (searches without matches)

  /**
   * Stremio protocol page size. stremio-core requests the next page with
   * `skip` = count of already received items, so blocks of up to 100 titles are returned.
   */
  CATALOG_PAGE_SIZE: 100,
  /** Maximum concurrent requests to TMDB when resolving IMDb IDs (respects rate limits) */
  TMDB_CONCURRENCY: 10
};
