import { CONFIG } from '../config.js';
import { decodeConfig } from '../types/config.js';
import type { CatalogDefinition, Manifest } from '../types/stremio.js';

export function getManifest(configParam?: string): Manifest {
  const config = decodeConfig(configParam);
  const catalogs: CatalogDefinition[] = [];

  // ==========================================
  // CATÁLOGOS DE PELÍCULAS
  // ==========================================
  if (config.enableMovies !== false) {
    // 1. Cine por País
    catalogs.push({
      id: 'imdb_country_movies',
      type: 'movie',
      name: '🌍 Películas por País (Top)',
      extra: [
        {
          name: 'genre',
          isRequired: false,
          options: CONFIG.COUNTRY_OPTIONS
        },
        { name: 'search', isRequired: false },
        { name: 'skip', isRequired: false }
      ]
    });

    // 2. Cine por Año
    catalogs.push({
      id: 'imdb_year_movies',
      type: 'movie',
      name: '📅 Películas por Año (Top)',
      extra: [
        {
          name: 'genre',
          isRequired: false,
          options: CONFIG.YEAR_OPTIONS
        },
        { name: 'search', isRequired: false },
        { name: 'skip', isRequired: false }
      ]
    });

    // 3. Cine por Calificación
    catalogs.push({
      id: 'imdb_rating_movies',
      type: 'movie',
      name: '⭐ Películas por Nota',
      extra: [
        {
          name: 'genre',
          isRequired: false,
          options: CONFIG.RATING_OPTIONS
        },
        { name: 'search', isRequired: false },
        { name: 'skip', isRequired: false }
      ]
    });
  }

  // ==========================================
  // CATÁLOGOS DE SERIES
  // ==========================================
  if (config.enableSeries !== false) {
    // 1. Series por País
    catalogs.push({
      id: 'imdb_country_series',
      type: 'series',
      name: '🌍 Series por País (Top)',
      extra: [
        {
          name: 'genre',
          isRequired: false,
          options: CONFIG.COUNTRY_OPTIONS
        },
        { name: 'search', isRequired: false },
        { name: 'skip', isRequired: false }
      ]
    });

    // 2. Series por Año
    catalogs.push({
      id: 'imdb_year_series',
      type: 'series',
      name: '📅 Series por Año (Top)',
      extra: [
        {
          name: 'genre',
          isRequired: false,
          options: CONFIG.YEAR_OPTIONS
        },
        { name: 'search', isRequired: false },
        { name: 'skip', isRequired: false }
      ]
    });

    // 3. Series por Calificación
    catalogs.push({
      id: 'imdb_rating_series',
      type: 'series',
      name: '⭐ Series por Nota',
      extra: [
        {
          name: 'genre',
          isRequired: false,
          options: CONFIG.RATING_OPTIONS
        },
        { name: 'search', isRequired: false },
        { name: 'skip', isRequired: false }
      ]
    });
  }

  // Presets adicionales configurables
  if (config.enableTopMovies8) {
    catalogs.push({
      id: 'top_movies_8',
      type: 'movie',
      name: '⭐ Top Películas IMDb 8.0+',
      extra: [{ name: 'skip', isRequired: false }]
    });
  }

  if (config.enableTopSeries8) {
    catalogs.push({
      id: 'top_series_8',
      type: 'series',
      name: '⭐ Top Series IMDb 8.0+',
      extra: [{ name: 'skip', isRequired: false }]
    });
  }

  if (config.enableRecentReleases) {
    catalogs.push({
      id: 'recent_releases',
      type: 'movie',
      name: '📅 Estrenos Destacados',
      extra: [{ name: 'skip', isRequired: false }]
    });
  }

  // Construir URLs de logo y background si PUBLIC_URL está configurada
  const logo = CONFIG.PUBLIC_URL ? `${CONFIG.PUBLIC_URL}/logo.svg` : undefined;
  const background = CONFIG.PUBLIC_URL ? `${CONFIG.PUBLIC_URL}/background.jpg` : undefined;

  return {
    id: 'community.imdb-year-catalog',
    version: '1.0.0',
    name: 'Buscador IMDb, País y Año',
    description: 'Explora películas y series organizadas en catálogos específicos por País, Año y Puntuación IMDb. Compatible con Nuvio y Alder.',
    logo: logo,
    background: background,
    resources: ['catalog'],
    types: ['movie', 'series'],
    behaviorHints: {
      configurable: true,
      configurationRequired: false
    },
    catalogs: catalogs
  };
}
