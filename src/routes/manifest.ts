import { CONFIG } from '../config.js';
import type { Manifest } from '../types/stremio.js';

export function getManifest(configParam?: string): Manifest {
  // En la Fase 4 añadiremos el parseo de configParam (base64) para personalizaciones
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
    catalogs: [
      {
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
      },
      {
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
      }
    ]
  };
}
