import type { Context } from 'hono';
import { CONFIG, resolveCountriesFromRegions } from '../config.js';
import { tmdbClient } from '../services/tmdbClient.js';
import { QueryParser, type ParsedFilters } from '../services/queryParser.js';
import { decodeConfig, type AddonUserConfig } from '../types/config.js';
import type { CatalogResponse } from '../types/stremio.js';
import { CATALOG_SPECS, type CatalogSpec } from './manifest.js';

/**
 * Extracts raw, undecoded `extra` segment from the request URL.
 * Hono decodes route parameters, which would turn an encoded `%26` in a search term
 * ("Fast & Furious") into a query delimiter `&`. Operating on the raw path preserves it.
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

/** Applies catalog preset filters and user defaults. */
function applyCatalogPreset(spec: CatalogSpec, filters: ParsedFilters, userConfig: AddonUserConfig): void {
  if (spec.kind === 'top_catalog') {
    // If no year was selected in dropdown (e.g. board view row), default to current year
    if (filters.year === undefined && filters.yearGte === undefined && filters.yearLte === undefined) {
      filters.year = new Date().getFullYear();
    }

    // Minimum rating configured by user (or 7.0 default)
    if (filters.voteAverageGte === undefined) {
      const minRating = userConfig.minRating !== undefined ? userConfig.minRating : 7.0;
      if (minRating > 0) {
        filters.voteAverageGte = minRating;
      }
    }

    // Origin regions/countries configured by user
    if (!filters.countries || filters.countries.length === 0) {
      const resolved = resolveCountriesFromRegions(userConfig.regions);
      if (resolved && resolved.length > 0) {
        filters.countries = resolved;
      }
    }

    // Sort by rating descending
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
 * GET /catalog/:type/:id/:extra?.json and GET /:config/catalog/:type/:id/:extra?.json
 */
export async function handleCatalog(c: Context): Promise<Response> {
  const type = c.req.param('type');
  const id = stripJson(c.req.param('id'));
  const spec = CATALOG_SPECS[id];

  // Unknown catalog or content type mismatch (e.g. series in a movies catalog)
  if (!spec || spec.type !== type) {
    return emptyResponse(c, CONFIG.HTTP_CACHE_CATALOG_CDN_S);
  }

  const filters = QueryParser.parseExtra(getRawExtra(c));
  const userConfig = decodeConfig(c.req.param('config'));

  // Search catalogs require a search query (isRequired in manifest)
  if (
    spec.kind === 'search' &&
    !filters.searchTitle &&
    !filters.genres &&
    filters.year === undefined &&
    filters.voteAverageGte === undefined
  ) {
    return emptyResponse(c, CONFIG.HTTP_CACHE_CATALOG_CDN_S);
  }

  applyCatalogPreset(spec, filters, userConfig);

  try {
    const { metas, complete } = await tmdbClient.getCatalogResult(spec.type, filters, userConfig);

    // Incomplete results (transient TMDB errors) or empty sets get short cache TTLs
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
    // TMDB errors: return valid empty response to Stremio with no-store
    return emptyResponse(c, 0);
  }
}
