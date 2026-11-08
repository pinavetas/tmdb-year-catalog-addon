import { CONFIG, buildYearOptions } from '../config.js';
import { decodeConfig } from '../types/config.js';
import type { CatalogDefinition, CatalogExtra, ContentType, Manifest } from '../types/stremio.js';

/** Versión semántica del addon. Stremio la usa para detectar actualizaciones del manifiesto. */
export const ADDON_VERSION = '1.1.0';
export const ADDON_ID = 'community.imdb-year-catalog';

export type CatalogKind = 'top_catalog' | 'search';

export interface CatalogSpec {
  id: string;
  type: Extract<ContentType, 'movie' | 'series'>;
  kind: CatalogKind;
}

/** Registro único de catálogos: lo usan el manifiesto y la validación de la ruta de catálogo. */
export const CATALOG_SPECS: Record<string, CatalogSpec> = {
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
  const yearOptions = buildYearOptions();
  const catalogs: CatalogDefinition[] = [];

  if (config.enableMovies !== false) {
    catalogs.push(
      dropdownCatalog('imdb_movies', 'movie', '🎬 Mejores Películas', yearOptions)
    );
  }

  if (config.enableSeries !== false) {
    catalogs.push(
      dropdownCatalog('imdb_series', 'series', '📺 Mejores Series', yearOptions)
    );
  }

  // Búsqueda inteligente: solo para los tipos de contenido activados
  if (config.enableSearch !== false) {
    if (config.enableMovies !== false) {
      catalogs.push(searchCatalog('imdb_search_movies', 'movie', '🔎 Películas (IMDb)'));
    }
    if (config.enableSeries !== false) {
      catalogs.push(searchCatalog('imdb_search_series', 'series', '🔎 Series (IMDb)'));
    }
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
      configurationRequired: !config.tmdbApiKey
    },
    catalogs
  };
}
