import type { Context } from 'hono';
import { tmdbClient } from '../services/tmdbClient.js';
import { QueryParser } from '../services/queryParser.js';
import type { CatalogResponse, ContentType } from '../types/stremio.js';

export async function handleCatalog(c: Context): Promise<Response> {
  const rawType = c.req.param('type') as ContentType;
  let rawId = c.req.param('id') || '';
  let rawExtra = c.req.param('extra');

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
  const validIds = ['imdb_year_movies', 'imdb_year_series'];
  if (!validIds.includes(rawId)) {
    return c.json<CatalogResponse>({ metas: [] });
  }

  try {
    // 1. Parsear filtros opcionales (género, año, búsqueda, skip)
    const filters = QueryParser.parseExtra(rawExtra);

    // 2. Obtener metadatos desde TMDB con caché
    const metas = await tmdbClient.getCatalog(rawType, filters);

    // 3. Responder con cabeceras de caché HTTP para acelerar aún más en clientes
    c.header('Cache-Control', 'public, max-age=1800'); // 30 minutos en cliente
    return c.json<CatalogResponse>({ metas });
  } catch (error) {
    console.error(`[CATALOG ERROR] Error sirviendo catálogo ${rawType}/${rawId}:`, error);
    return c.json<CatalogResponse>({ metas: [] });
  }
}
