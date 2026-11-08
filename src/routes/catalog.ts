import type { Context } from 'hono';
import { CONFIG, resolveCountriesFromRegions } from '../config.js';
import { tmdbClient } from '../services/tmdbClient.js';
import { QueryParser, type ParsedFilters } from '../services/queryParser.js';
import { decodeConfig, type AddonUserConfig } from '../types/config.js';
import type { CatalogResponse } from '../types/stremio.js';
import { CATALOG_SPECS, type CatalogSpec } from './manifest.js';

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

/** Aplica los filtros configurados o por defecto del catálogo. */
function applyCatalogPreset(spec: CatalogSpec, filters: ParsedFilters, userConfig: AddonUserConfig): void {
  if (spec.kind === 'top_catalog') {
    // Si no se seleccionó año en el desplegable (fila del tablero), se muestra el año en curso
    if (filters.year === undefined && filters.yearGte === undefined && filters.yearLte === undefined) {
      filters.year = new Date().getFullYear();
    }

    // Nota mínima configurada por el usuario (o 7.0 por defecto)
    if (filters.voteAverageGte === undefined) {
      const minRating = userConfig.minRating !== undefined ? userConfig.minRating : 7.0;
      if (minRating > 0) {
        filters.voteAverageGte = minRating;
      }
    }

    // Regiones/países configurados por el usuario
    if (!filters.countries || filters.countries.length === 0) {
      const resolved = resolveCountriesFromRegions(userConfig.regions);
      if (resolved && resolved.length > 0) {
        filters.countries = resolved;
      }
    }

    // Ordenar de mayor a menor puntuación
    if (!filters.sortBy) {
      filters.sortBy = 'vote_average.desc';
    }
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
  const userConfig = decodeConfig(c.req.param('config'));

  // Los catálogos de búsqueda exigen el parámetro search (isRequired en el manifiesto)
  if (spec.kind === 'search' && !filters.searchTitle && filters.year === undefined && filters.voteAverageGte === undefined) {
    return emptyResponse(c, CONFIG.HTTP_CACHE_CATALOG_CDN_S);
  }

  applyCatalogPreset(spec, filters, userConfig);

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
