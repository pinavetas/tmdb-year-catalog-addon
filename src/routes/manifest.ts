import { CONFIG, buildYearOptions } from '../config.js';
import { decodeConfig } from '../types/config.js';
import type { CatalogDefinition, CatalogExtra, ContentType, Manifest } from '../types/stremio.js';

/** Versión semántica del addon. Stremio la usa para detectar actualizaciones del manifiesto. */
export const ADDON_VERSION = '1.1.0';
export const ADDON_ID = 'community.tmdb-year-catalog';

export type CatalogKind = 'top_catalog' | 'search';

export interface CatalogSpec {
  id: string;
  type: Extract<ContentType, 'movie' | 'series'>;
  kind: CatalogKind;
}

/** Registro único de catálogos: lo usan el manifiesto y la validación de la ruta de catálogo. */
export const CATALOG_SPECS: Record<string, CatalogSpec> = {
  tmdb_movies: { id: 'tmdb_movies', type: 'movie', kind: 'top_catalog' },
  tmdb_series: { id: 'tmdb_series', type: 'series', kind: 'top_catalog' },
  tmdb_search_movies: { id: 'tmdb_search_movies', type: 'movie', kind: 'search' },
  tmdb_search_series: { id: 'tmdb_search_series', type: 'series', kind: 'search' },
  // Alias de retrocompatibilidad
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
 * Catálogo exclusivo de búsqueda: `search` obligatorio hace que solo aparezca en los resultados
 * del buscador y no en el tablero ni en Descubrir (evita filas duplicadas al buscar).
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
 * Genera el manifiesto Stremio v3.
 * @param configParam Segmento Base64 con la configuración del usuario (opcional)
 * @param baseUrl URL pública del addon, usada para construir la URL absoluta del logo
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

  return {
    id: ADDON_ID,
    version: ADDON_VERSION,
    name: addonName,
    description: addonDesc,
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
