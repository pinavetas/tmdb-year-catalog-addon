import { CONFIG } from '../config.js';
import { decodeConfig } from '../types/config.js';
import type { CatalogDefinition, Manifest } from '../types/stremio.js';

export function getManifest(configParam?: string): Manifest {
  const config = decodeConfig(configParam);
  const catalogs: CatalogDefinition[] = [];

  // 1. Catálogo principal de películas por nota y año
  if (config.enableMovies !== false) {
    catalogs.push({
      id: 'imdb_year_movies',
      type: 'movie',
      name: 'Películas por Nota y Año',
      extra: [
        {
          name: 'genre',
          isRequired: false,
          options: CONFIG.FILTER_OPTIONS
        },
        {
          name: 'search',
          isRequired: false
        },
        {
          name: 'skip',
          isRequired: false
        }
      ]
    });
  }

  // 2. Catálogo principal de series por nota y año
  if (config.enableSeries !== false) {
    catalogs.push({
      id: 'imdb_year_series',
      type: 'series',
      name: 'Series por Nota y Año',
      extra: [
        {
          name: 'genre',
          isRequired: false,
          options: CONFIG.FILTER_OPTIONS
        },
        {
          name: 'search',
          isRequired: false
        },
        {
          name: 'skip',
          isRequired: false
        }
      ]
    });
  }

  // 3. Carrusel Preset: Top Películas IMDb 8.0+
  if (config.enableTopMovies8) {
    catalogs.push({
      id: 'top_movies_8',
      type: 'movie',
      name: '⭐ Top Películas IMDb 8.0+',
      extra: [{ name: 'skip', isRequired: false }]
    });
  }

  // 4. Carrusel Preset: Top Series IMDb 8.0+
  if (config.enableTopSeries8) {
    catalogs.push({
      id: 'top_series_8',
      type: 'series',
      name: '⭐ Top Series IMDb 8.0+',
      extra: [{ name: 'skip', isRequired: false }]
    });
  }

  // 5. Carrusel Preset: Estrenos del Año
  if (config.enableRecentReleases) {
    catalogs.push({
      id: 'recent_releases',
      type: 'movie',
      name: '📅 Estrenos Destacados',
      extra: [{ name: 'skip', isRequired: false }]
    });
  }

  return {
    id: 'community.imdb-year-catalog',
    version: '1.0.0',
    name: 'Buscador IMDb y Año',
    description: 'Explora y busca películas y series filtrando por puntuación (IMDb/TMDB) y año de estreno. Compatible con Nuvio y Alder.',
    resources: ['catalog'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    behaviorHints: {
      configurable: true,
      configurationRequired: false
    },
    catalogs: catalogs
  };
}
