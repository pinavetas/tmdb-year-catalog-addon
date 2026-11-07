import { CONFIG, buildYearOptions } from '../config.js';
import { decodeConfig } from '../types/config.js';
import type { CatalogDefinition, CatalogExtra, ContentType, Manifest } from '../types/stremio.js';

/** Versión semántica del addon. Stremio la usa para detectar actualizaciones del manifiesto. */
export const ADDON_VERSION = '1.1.0';
export const ADDON_ID = 'community.imdb-year-catalog';

export type CatalogKind = 'country' | 'year' | 'rating' | 'search' | 'top8' | 'recent';

export interface CatalogSpec {
  id: string;
  type: Extract<ContentType, 'movie' | 'series'>;
  kind: CatalogKind;
}

/** Registro único de catálogos: lo usan el manifiesto y la validación de la ruta de catálogo. */
export const CATALOG_SPECS: Record<string, CatalogSpec> = {
  imdb_country_movies: { id: 'imdb_country_movies', type: 'movie', kind: 'country' },
  imdb_year_movies: { id: 'imdb_year_movies', type: 'movie', kind: 'year' },
  imdb_rating_movies: { id: 'imdb_rating_movies', type: 'movie', kind: 'rating' },
  imdb_search_movies: { id: 'imdb_search_movies', type: 'movie', kind: 'search' },
  imdb_country_series: { id: 'imdb_country_series', type: 'series', kind: 'country' },
  imdb_year_series: { id: 'imdb_year_series', type: 'series', kind: 'year' },
  imdb_rating_series: { id: 'imdb_rating_series', type: 'series', kind: 'rating' },
  imdb_search_series: { id: 'imdb_search_series', type: 'series', kind: 'search' },
  top_movies_8: { id: 'top_movies_8', type: 'movie', kind: 'top8' },
  top_series_8: { id: 'top_series_8', type: 'series', kind: 'top8' },
  recent_releases: { id: 'recent_releases', type: 'movie', kind: 'recent' }
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
  const yearOptions = buildYearOptions();
  const catalogs: CatalogDefinition[] = [];

  if (config.enableMovies !== false) {
    catalogs.push(
      dropdownCatalog('imdb_country_movies', 'movie', '🌍 Películas por País', CONFIG.COUNTRY_OPTIONS),
      dropdownCatalog('imdb_year_movies', 'movie', '📅 Películas por Año', yearOptions),
      dropdownCatalog('imdb_rating_movies', 'movie', '⭐ Películas por Nota', CONFIG.RATING_OPTIONS)
    );
  }

  if (config.enableSeries !== false) {
    catalogs.push(
      dropdownCatalog('imdb_country_series', 'series', '🌍 Series por País', CONFIG.COUNTRY_OPTIONS),
      dropdownCatalog('imdb_year_series', 'series', '📅 Series por Año', yearOptions),
      dropdownCatalog('imdb_rating_series', 'series', '⭐ Series por Nota', CONFIG.RATING_OPTIONS)
    );
  }

  // Búsqueda inteligente: solo para los tipos de contenido activados
  if (config.enableSearch !== false) {
    if (config.enableMovies !== false) {
      catalogs.push(searchCatalog('imdb_search_movies', 'movie', '🔎 Películas (IMDb y Año)'));
    }
    if (config.enableSeries !== false) {
      catalogs.push(searchCatalog('imdb_search_series', 'series', '🔎 Series (IMDb y Año)'));
    }
  }

  // Presets adicionales configurables
  if (config.enableTopMovies8) {
    catalogs.push({ id: 'top_movies_8', type: 'movie', name: '⭐ Top Películas 8.0+', extra: [SKIP] });
  }

  if (config.enableTopSeries8) {
    catalogs.push({ id: 'top_series_8', type: 'series', name: '⭐ Top Series 8.0+', extra: [SKIP] });
  }

  if (config.enableRecentReleases) {
    catalogs.push({ id: 'recent_releases', type: 'movie', name: '🆕 Estrenos Destacados', extra: [SKIP] });
  }

  const types = [...new Set(catalogs.map((c) => c.type))];
  const publicBase = (CONFIG.PUBLIC_URL || baseUrl || '').replace(/\/+$/, '');

  return {
    id: ADDON_ID,
    version: ADDON_VERSION,
    name: 'Buscador IMDb, País y Año',
    description:
      'Explora películas y series por país de origen, año o época y puntuación, con búsqueda inteligente ("2023 8+", "dune 2024"). Devuelve IMDb IDs compatibles con cualquier addon de streams. Funciona en Stremio, Nuvio y Alder. Datos de TMDB.',
    logo: publicBase ? `${publicBase}/logo.png` : undefined,
    resources: ['catalog'],
    types: types.length > 0 ? types : ['movie', 'series'],
    behaviorHints: {
      configurable: true,
      configurationRequired: false
    },
    catalogs
  };
}
