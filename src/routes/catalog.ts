import type { Context } from 'hono';
import { tmdbClient } from '../services/tmdbClient.js';
import { QueryParser } from '../services/queryParser.js';
import { decodeConfig } from '../types/config.js';
import type { CatalogResponse, ContentType } from '../types/stremio.js';

export async function handleCatalog(c: Context): Promise<Response> {
  const rawType = c.req.param('type') as ContentType;
  let rawId = c.req.param('id') || '';
  let rawExtra = c.req.param('extra');
  const configParam = c.req.param('config');

  // Limpiar extensión .json si viene adherida a id o extra
  if (rawId.endsWith('.json')) {
    rawId = rawId.slice(0, -5);
  }

  if (rawExtra && rawExtra.endsWith('.json')) {
    rawExtra = rawExtra.slice(0, -5);
  }

  // Validar tipos soportados
  if (rawType !== 'movie' && rawType !== 'series') {
    return c.json<CatalogResponse>({ metas: [] });
  }

  // Validar IDs de catálogo conocidos
  const validIds = [
    'imdb_country_movies',
    'imdb_country_series',
    'imdb_year_movies',
    'imdb_year_series',
    'imdb_rating_movies',
    'imdb_rating_series',
    'top_movies_8',
    'top_series_8',
    'recent_releases'
  ];
  if (!validIds.includes(rawId)) {
    return c.json<CatalogResponse>({ metas: [] });
  }

  // Validar coherencia tipo/catálogo (ej. no servir series para un catálogo de películas)
  const movieOnlyCatalogs = ['imdb_country_movies', 'imdb_year_movies', 'imdb_rating_movies', 'top_movies_8', 'recent_releases'];
  const seriesOnlyCatalogs = ['imdb_country_series', 'imdb_year_series', 'imdb_rating_series', 'top_series_8'];

  if (rawType === 'movie' && seriesOnlyCatalogs.includes(rawId)) {
    return c.json<CatalogResponse>({ metas: [] });
  }
  if (rawType === 'series' && movieOnlyCatalogs.includes(rawId)) {
    return c.json<CatalogResponse>({ metas: [] });
  }

  try {
    // 1. Parsear filtros opcionales (país, año, nota, búsqueda, skip)
    const filters = QueryParser.parseExtra(rawExtra);

    // 2. Aplicar reglas de presets según el catálogo seleccionado
    if (rawId === 'top_movies_8' || rawId === 'top_series_8') {
      filters.voteAverageGte = 8.0;
    } else if (rawId === 'recent_releases') {
      filters.year = new Date().getFullYear();
    } else if (rawId.includes('country') && !filters.country && !filters.countries) {
      // Si el usuario entra al catálogo de países pero aún no ha seleccionado ninguno en el desplegable,
      // mostrar España por defecto para no mostrar un listado vacío
      filters.country = 'ES';
    }

    // 3. Decodificar configuración de usuario (si existe en la URL)
    const userConfig = decodeConfig(configParam);

    // 4. Obtener metadatos desde TMDB con caché y configuración de usuario
    const metas = await tmdbClient.getCatalog(rawType, filters, userConfig);

    // 5. Responder con cabeceras de caché HTTP para acelerar aún más en clientes
    c.header('Cache-Control', 'public, max-age=1800'); // 30 minutos en cliente
    return c.json<CatalogResponse>({ metas });
  } catch (error) {
    console.error(`[CATALOG ERROR] Error sirviendo catálogo ${rawType}/${rawId}:`, error);
    return c.json<CatalogResponse>({ metas: [] });
  }
}
