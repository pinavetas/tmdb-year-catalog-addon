// Carga `.env` en local con el soporte nativo de Node (sin dependencias). Las variables ya
// definidas en el entorno tienen prioridad. En Vercel no existe `.env` y se ignora.
try {
  process.loadEnvFile();
} catch {
  // Sin fichero .env: se usan solo las variables del entorno
}

function intFromEnv(name: string, fallback: number): number {
  const parsed = parseInt(process.env[name] || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Normaliza PUBLIC_URL eliminando la barra final (evita URLs del tipo `https://x.com//logo.png`). */
function normalizePublicUrl(value: string | undefined): string {
  return (value || '').trim().replace(/\/+$/, '');
}

/** Primer año con opción individual en el desplegable de años (los anteriores van agrupados por rangos). */
const FIRST_INDIVIDUAL_YEAR = 2020;

/**
 * Opciones del catálogo de años. Los años individuales se generan dinámicamente desde el año
 * actual hasta 2020, para que el desplegable no se quede desactualizado al cambiar de año.
 */
export function buildYearOptions(currentYear = new Date().getFullYear()): string[] {
  const years: string[] = [];
  for (let y = currentYear; y >= FIRST_INDIVIDUAL_YEAR; y--) {
    years.push(`📅 ${y}`);
  }
  return [
    ...years,
    '📅 2015 - 2019',
    '📅 2010 - 2014',
    '📅 Década 2000',
    '📅 Años 90',
    '📅 Años 80',
    '📅 Años 70',
    '📅 Clásicos (<1970)'
  ];
}

export const REGIONS: Record<string, { label: string; countries: string[] }> = {
  europe: {
    label: '🇪🇺 Europa',
    countries: ['ES', 'GB', 'FR', 'IT', 'DE', 'SE', 'DK', 'NO', 'FI', 'NL', 'BE', 'IE', 'PL', 'PT', 'AT', 'CH']
  },
  spain: {
    label: '🇪🇸 España',
    countries: ['ES']
  },
  us: {
    label: '🇺🇸 Estados Unidos / Hollywood',
    countries: ['US']
  },
  latam: {
    label: '🌎 Latinoamérica',
    countries: ['AR', 'MX', 'BR', 'CO', 'CL', 'UY', 'PE']
  },
  asia: {
    label: '🌏 Asia',
    countries: ['JP', 'KR', 'CN', 'HK', 'TW', 'IN']
  }
};

/** Resuelve la lista de códigos de país únicos a partir de las regiones seleccionadas. */
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
  /** Idioma de títulos y sinopsis devueltos por TMDB */
  TMDB_LANGUAGE: process.env.TMDB_LANGUAGE || 'es-ES',

  // TTLs de caché en memoria (milisegundos)
  CACHE_TTL_CATALOG_MS: 6 * 60 * 60 * 1000, // 6 horas
  CACHE_TTL_IDS_MS: 7 * 24 * 60 * 60 * 1000, // 7 días

  // TTLs de caché HTTP (segundos). `s-maxage` lo usa la CDN de Vercel / proxies compartidos.
  HTTP_CACHE_CATALOG_CLIENT_S: 30 * 60, // 30 min en el cliente
  HTTP_CACHE_CATALOG_CDN_S: 6 * 60 * 60, // 6 h en la CDN
  HTTP_CACHE_STALE_S: 24 * 60 * 60, // servir contenido caducado mientras se revalida
  HTTP_CACHE_EMPTY_S: 5 * 60, // resultados vacíos legítimos (búsquedas sin coincidencias)

  /**
   * Tamaño de página del protocolo Stremio. stremio-core solicita la página siguiente con
   * `skip` = suma de elementos ya recibidos, así que se devuelven bloques de hasta 100 títulos.
   */
  CATALOG_PAGE_SIZE: 100,
  /** Peticiones concurrentes máximas a TMDB al resolver IMDb IDs (respeta el rate limit) */
  TMDB_CONCURRENCY: 10
};
