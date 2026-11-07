import type { Context } from 'hono';
import { CONFIG } from '../config.js';
import { tmdbClient } from '../services/tmdbClient.js';
import { QueryParser, type ParsedFilters } from '../services/queryParser.js';
import { decodeConfig } from '../types/config.js';
import type { CatalogResponse } from '../types/stremio.js';
import { CATALOG_SPECS, type CatalogKind } from './manifest.js';

/** Días hacia atrás que cubre el preset "Estrenos Destacados" */
const RECENT_RELEASES_DAYS = 120;

/**
 * Extrae el segmento `extra` SIN decodificar a partir de la ruta original de la petición.
 * Hono decodifica los parámetros de ruta, lo que convertiría un `%26` de una búsqueda
 * ("Fast & Furious") en un separador `&`. Por eso se trabaja con la ruta cruda.
 */
function getRawExtra(c: Context): string | undefined {
  const pathname = new URL(c.req.url).pathname;
  const match = pathname.match(/\/catalog\/[^/]+\/[^/]+\/(.+)$/);
  if (!match) return undefined;
  return match[1].replace(/\.json$/, '');
}

function stripJson(value: string | undefined): string {
  return (value || '').replace(/\.json$/, '');
}

/** Aplica los filtros fijos o por defecto de cada tipo de catálogo. */
function applyCatalogPreset(kind: CatalogKind, filters: ParsedFilters): void {
  switch (kind) {
    case 'top8':
      filters.voteAverageGte = 8.0;
      break;
    case 'recent': {
      const since = new Date(Date.now() - RECENT_RELEASES_DAYS * 24 * 60 * 60 * 1000);
      filters.releaseDateGte = since.toISOString().slice(0, 10);
      filters.sortBy = 'popularity.desc';
      break;
    }
    case 'country':
      // Sin país seleccionado (fila del tablero) se muestra España por defecto
      if (!filters.countries?.length) filters.countries = ['ES'];
      break;
    case 'year':
      // Sin año seleccionado (fila del tablero) se muestra el año en curso
      if (filters.year === undefined && filters.yearGte === undefined && filters.yearLte === undefined) {
        filters.year = new Date().getFullYear();
      }
      break;
    case 'rating':
    case 'search':
      break;
  }
}

function emptyResponse(c: Context, cacheSeconds: number): Response {
  c.header('Cache-Control', cacheSeconds > 0 ? `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}` : 'no-store');
  return c.json<CatalogResponse>({ metas: [] });
}

/**
 * GET /catalog/:type/:id/:extra?.json y GET /:config/catalog/:type/:id/:extra?.json
 */
export async function handleCatalog(c: Context): Promise<Response> {
  const type = c.req.param('type');
  const id = stripJson(c.req.param('id'));
  const spec = CATALOG_SPECS[id];

  // Catálogo desconocido o tipo incoherente (ej. series en un catálogo de películas)
  if (!spec || spec.type !== type) {
    return emptyResponse(c, CONFIG.HTTP_CACHE_CATALOG_CDN_S);
  }

  const filters = QueryParser.parseExtra(getRawExtra(c));

  // Los catálogos de búsqueda exigen el parámetro search (isRequired en el manifiesto)
  if (spec.kind === 'search' && !filters.searchTitle && filters.year === undefined && filters.voteAverageGte === undefined) {
    return emptyResponse(c, CONFIG.HTTP_CACHE_CATALOG_CDN_S);
  }

  applyCatalogPreset(spec.kind, filters);
  const userConfig = decodeConfig(c.req.param('config'));

  try {
    const { metas, complete } = await tmdbClient.getCatalogResult(spec.type, filters, userConfig);

    // Listados incompletos (fallos puntuales de TMDB) o vacíos se cachean poco tiempo
    const fullCache = complete && metas.length > 0;
    const clientTtl = fullCache ? CONFIG.HTTP_CACHE_CATALOG_CLIENT_S : CONFIG.HTTP_CACHE_EMPTY_S;
    const cdnTtl = fullCache ? CONFIG.HTTP_CACHE_CATALOG_CDN_S : CONFIG.HTTP_CACHE_EMPTY_S;

    c.header(
      'Cache-Control',
      `public, max-age=${clientTtl}, s-maxage=${cdnTtl}, stale-while-revalidate=${CONFIG.HTTP_CACHE_STALE_S}, stale-if-error=${CONFIG.HTTP_CACHE_STALE_S}`
    );
    return c.json<CatalogResponse>({
      metas,
      cacheMaxAge: clientTtl,
      staleRevalidate: CONFIG.HTTP_CACHE_STALE_S,
      staleError: CONFIG.HTTP_CACHE_STALE_S
    });
  } catch (error) {
    console.error(
      `[CATALOG ERROR] ${spec.type}/${spec.id}:`,
      error instanceof Error ? error.message : error
    );
    // Errores de TMDB: respuesta vacía válida para Stremio, sin cachear
    return emptyResponse(c, 0);
  }
}
