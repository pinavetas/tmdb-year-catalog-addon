import { CONFIG, buildYearOptions } from '../config.js';
import { decodeConfig } from '../types/config.js';
import type { CatalogDefinition, CatalogExtra, ContentType, Manifest } from '../types/stremio.js';

/** Semantic version. Stremio uses this to detect manifest updates. */
export const ADDON_VERSION = '1.1.0';
export const ADDON_ID = 'community.tmdb-year-catalog';

export type CatalogKind = 'top_catalog' | 'search';

export interface CatalogSpec {
  id: string;
  type: Extract<ContentType, 'movie' | 'series'>;
  kind: CatalogKind;
}

/** Registry of supported catalogs: used by manifest generator and catalog route validator. */
export const CATALOG_SPECS: Record<string, CatalogSpec> = {
  tmdb_movies: { id: 'tmdb_movies', type: 'movie', kind: 'top_catalog' },
  tmdb_series: { id: 'tmdb_series', type: 'series', kind: 'top_catalog' },
  tmdb_search_movies: { id: 'tmdb_search_movies', type: 'movie', kind: 'search' },
  tmdb_search_series: { id: 'tmdb_search_series', type: 'series', kind: 'search' },
  // Backward compatibility aliases for existing installs
  imdb_movies: { id: 'imdb_movies', type: 'movie', kind: 'top_catalog' },
  imdb_series: { id: 'imdb_series', type: 'series', kind: 'top_catalog' },
  imdb_search_movies: { id: 'imdb_search_movies', type: 'movie', kind: 'search' },
  imdb_search_series: { id: 'imdb_search_series', type: 'series', kind: 'search' }
};

const SKIP: CatalogExtra = { name: 'skip', isRequired: false };

function dropdownCatalog(id: string, type: 'movie' | 'series', name: string, options: string[]): CatalogDefinition {
  return {
    id,
    type,
    name,
    extra: [{ name: 'genre', isRequired: false, options }, SKIP]
  };
}

/**
 * Search-only catalog: `isRequired: true` ensures it only appears in search results
 * and not in the main Discover/Board view, preventing duplicate rows.
 */
function searchCatalog(id: string, type: 'movie' | 'series', name: string): CatalogDefinition {
  return {
    id,
    type,
    name,
    extra: [{ name: 'search', isRequired: true }, SKIP]
  };
}

/**
 * Builds the Stremio v3 manifest.
 * @param configParam URL Base64-encoded user configuration (optional)
 * @param baseUrl Addon public base URL for absolute logo URL resolution
 */
export function getManifest(configParam?: string, baseUrl?: string): Manifest {
  const config = decodeConfig(configParam);
  const lang = config.language || 'en';
  const isEs = lang === 'es';
  const yearOptions = buildYearOptions(new Date().getFullYear(), lang);
  const catalogs: CatalogDefinition[] = [];

  const moviesName = isEs ? 'Mejores Películas' : 'Top Movies';
  const seriesName = isEs ? 'Mejores Series' : 'Top Series';
  const searchMoviesName = isEs ? 'Películas (TMDB)' : 'Movies (TMDB)';
  const searchSeriesName = isEs ? 'Series (TMDB)' : 'Series (TMDB)';

  if (config.enableMovies !== false) {
    catalogs.push(
      dropdownCatalog('tmdb_movies', 'movie', moviesName, yearOptions)
    );
  }

  if (config.enableSeries !== false) {
    catalogs.push(
      dropdownCatalog('tmdb_series', 'series', seriesName, yearOptions)
    );
  }

  // Búsqueda inteligente: solo para los tipos de contenido activados
  if (config.enableSearch !== false) {
    if (config.enableMovies !== false) {
      catalogs.push(searchCatalog('tmdb_search_movies', 'movie', searchMoviesName));
    }
    if (config.enableSeries !== false) {
      catalogs.push(searchCatalog('tmdb_search_series', 'series', searchSeriesName));
    }
  }

  const types = [...new Set(catalogs.map((c) => c.type))];
  const publicBase = (CONFIG.PUBLIC_URL || baseUrl || '').replace(/\/+$/, '');

  const addonName = isEs ? 'Catálogo TMDB: Año, País y Calidad' : 'TMDB Catalog: Year, Country & Rating';
  const addonDesc = isEs
    ? 'Explora películas y series por país de origen, año o época y puntuación de TMDB, con búsqueda inteligente ("2023 8+", "dune 2024"). Devuelve IMDb IDs compatibles con cualquier addon de streams. Funciona en Stremio, Nuvio y Alder.'
    : 'Browse top movies and series by country of origin, year/decade and TMDB rating, with smart search ("2023 8+", "dune 2024"). Returns IMDb IDs compatible with all stream addons. Works in Stremio, Nuvio and Alder.';

  // Clients that ignore `configurationRequired` (e.g. Nuvio) still show the description
  const needsSetup = !config.tmdbApiKey && !CONFIG.TMDB_API_KEY;
  const setupNotice = !needsSetup
    ? ''
    : isEs
      ? `⚙️ Requiere configuración: abre ${publicBase || ''}/configure, añade tu clave gratuita de TMDB e instala desde allí. `
      : `⚙️ Setup required: open ${publicBase || ''}/configure, add your free TMDB key and install from there. `;

  return {
    id: ADDON_ID,
    version: ADDON_VERSION,
    name: addonName,
    description: setupNotice + addonDesc,
    logo: publicBase ? `${publicBase}/logo.png` : undefined,
    resources: ['catalog'],
    types: types.length > 0 ? types : ['movie', 'series'],
    behaviorHints: {
      configurable: true,
      configurationRequired: !config.tmdbApiKey
    },
    catalogs
  };
}
