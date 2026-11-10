import { CONFIG } from '../config.js';
import { cacheService } from './cacheService.js';
import type { ParsedFilters } from './queryParser.js';
import type { MetaPreview } from '../types/stremio.js';
import type { AddonUserConfig } from '../types/config.js';
import type { TmdbDiscoverResponse, TmdbExternalIds, TmdbMovieItem, TmdbTvItem } from '../types/tmdb.js';

type TmdbItem = TmdbMovieItem | TmdbTvItem;
type MediaType = 'movie' | 'series';

/** Tiempo máximo de espera por request a TMDB (ms) */
const FETCH_TIMEOUT_MS = 8000;
/** Número máximo de reintentos ante errores de red, 429 o 5xx */
const MAX_RETRIES = 2;
/** Tamaño de página fijo de la API de TMDB */
const TMDB_PAGE_SIZE = 20;
/** TMDB no devuelve más allá de la página 500 en discover/search */
const TMDB_MAX_PAGE = 500;

/** Error de TMDB que no debe cachearse (clave inválida, caída del servicio, timeout...) */
export class TmdbError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'TmdbError';
  }
}

/** Ejecuta `fn` sobre `items` con una concurrencia máxima, preservando el orden. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Bilingual dictionary of official TMDB genre IDs */
export const TMDB_GENRES: Record<number, { en: string; es: string }> = {
  28: { en: 'Action', es: 'Acción' },
  12: { en: 'Adventure', es: 'Aventura' },
  16: { en: 'Animation', es: 'Animación' },
  35: { en: 'Comedy', es: 'Comedia' },
  80: { en: 'Crime', es: 'Crimen' },
  99: { en: 'Documentary', es: 'Documental' },
  18: { en: 'Drama', es: 'Drama' },
  10751: { en: 'Family', es: 'Familia' },
  14: { en: 'Fantasy', es: 'Fantasía' },
  36: { en: 'History', es: 'Historia' },
  27: { en: 'Horror', es: 'Terror' },
  10402: { en: 'Music', es: 'Música' },
  9648: { en: 'Mystery', es: 'Misterio' },
  10749: { en: 'Romance', es: 'Romance' },
  878: { en: 'Sci-Fi', es: 'Ciencia Ficción' },
  10770: { en: 'TV Movie', es: 'Película de TV' },
  53: { en: 'Thriller', es: 'Suspense' },
  10752: { en: 'War', es: 'Bélica' },
  37: { en: 'Western', es: 'Western' },
  10759: { en: 'Action & Adventure', es: 'Acción y Aventura' },
  10762: { en: 'Kids', es: 'Infantil' },
  10763: { en: 'News', es: 'Noticias' },
  10764: { en: 'Reality', es: 'Reality' },
  10765: { en: 'Sci-Fi & Fantasy', es: 'Ciencia Ficción y Fantasía' },
  10766: { en: 'Soap', es: 'Telenovela' },
  10767: { en: 'Talk', es: 'Talk Show' },
  10768: { en: 'War & Politics', es: 'Bélica y Política' }
};

export class TmdbClient {
  private baseUrl = 'https://api.themoviedb.org/3';
  private defaultApiKey: string;

  constructor(apiKey?: string) {
    this.defaultApiKey = apiKey ?? CONFIG.TMDB_API_KEY;
  }

  /**
   * Builds request URL and authentication headers. TMDB accepts v3 keys as query param
   * (`api_key`) or v4 read access tokens (JWT) as `Authorization: Bearer` header.
   */
  private buildRequest(path: string, params: URLSearchParams, apiKey: string): { url: string; headers: Record<string, string> } {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey.includes('.')) {
      headers.Authorization = `Bearer ${apiKey}`;
    } else {
      params.set('api_key', apiKey);
    }
    return { url: `${this.baseUrl}${path}?${params.toString()}`, headers };
  }

  /**
   * GET JSON with timeout and retries on 429 (rate limit), 5xx and network errors.
   * Throws TmdbError if the final response is unsuccessful.
   */
  private async getJson<T>(path: string, params: URLSearchParams, apiKey: string): Promise<T> {
    const { url, headers } = this.buildRequest(path, params, apiKey);
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

        if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
          const retryAfter = parseInt(res.headers.get('Retry-After') || '', 10);
          const waitS = Number.isFinite(retryAfter) ? Math.min(Math.max(retryAfter, 1), 5) : attempt + 1;
          await res.body?.cancel();
          await new Promise((r) => setTimeout(r, waitS * 1000));
          continue;
        }

        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new TmdbError(`TMDB ${res.status} at ${path}: ${body.slice(0, 200)}`, res.status);
        }

        return (await res.json()) as T;
      } catch (err) {
        // Deterministic HTTP errors (4xx) are not retried
        if (err instanceof TmdbError) throw err;
        lastError = err;
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
      }
    }

    throw new TmdbError(`TMDB unreachable at ${path}: ${String(lastError)}`);
  }

  /**
   * Fetches a block of up to CATALOG_PAGE_SIZE (100) titles applying filters and user config.
   * Throws TmdbError on TMDB failures (not cached).
   */
  async getCatalog(type: MediaType, filters: ParsedFilters, userConfig?: AddonUserConfig): Promise<MetaPreview[]> {
    return (await this.getCatalogResult(type, filters, userConfig)).metas;
  }

  /**
   * Like getCatalog, but also indicates whether the result is complete. If IMDb ID resolution
   * failed transiently (rate limit, timeout...), `complete` is false and the result is not
   * stored in long-term cache to avoid pinning an incomplete list for hours.
   */
  async getCatalogResult(
    type: MediaType,
    filters: ParsedFilters,
    userConfig?: AddonUserConfig
  ): Promise<{ metas: MetaPreview[]; complete: boolean }> {
    const apiKey = userConfig?.tmdbApiKey?.trim() || this.defaultApiKey;
    if (!apiKey) {
      throw new TmdbError('No TMDB API key configured. You must configure the addon with your TMDB key at /configure');
    }

    const minVotes =
      type === 'movie'
        ? userConfig?.minVotesMovie ?? CONFIG.DEFAULT_MIN_VOTES_MOVIE
        : userConfig?.minVotesSeries ?? CONFIG.DEFAULT_MIN_VOTES_SERIES;

    // Pagination: stremio-core sends skip = count of already received titles. As dropped titles
    // without IMDb ID may result in slightly under 100 items, rounding absorbs the difference
    // and keeps pagination stable.
    const block = Math.round(filters.skip / CONFIG.CATALOG_PAGE_SIZE);
    const pagesPerBlock = CONFIG.CATALOG_PAGE_SIZE / TMDB_PAGE_SIZE;
    const firstPage = block * pagesPerBlock + 1;

    // 1. Cache by normalized query (results do not depend on the user's API key)
    const userLang = userConfig?.language || 'en';
    const tmdbLang = userLang === 'es' ? 'es-ES' : 'en-US';
    const rpdbKey = userConfig?.rpdbKey?.trim();
    const { skip: _skip, ...queryFilters } = filters;
    const cacheKey = `${type}:${JSON.stringify(queryFilters)}:${minVotes}:${block}:${tmdbLang}:${rpdbKey || ''}`;
    const cached = cacheService.getCatalog(cacheKey);
    if (cached) return { metas: cached, complete: true };

    // 2. Search by title or discover with filters
    const fetchPage = (page: number) =>
      filters.searchTitle
        ? this.searchPage(type, filters, page, apiKey, tmdbLang)
        : this.discoverPage(type, filters, page, minVotes, apiKey, tmdbLang);

    const first = await fetchPage(firstPage);
    const lastPage = Math.min(first.total_pages || 0, TMDB_MAX_PAGE, firstPage + pagesPerBlock - 1);
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, lastPage - firstPage) }, (_, i) => fetchPage(firstPage + i + 1))
    );

    const seen = new Set<number>();
    let items: TmdbItem[] = [];
    for (const page of [first, ...rest]) {
      for (const item of page.results || []) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          items.push(item);
        }
      }
    }

    // In title searches with minimum score ("dune 7+"), filter locally
    if (filters.searchTitle && filters.voteAverageGte !== undefined) {
      items = items.filter((item) => item.vote_average >= filters.voteAverageGte!);
    }

    // 3. Resolve IMDb IDs with bounded concurrency (respects TMDB rate limits)
    let complete = true;
    const imdbIds = await mapWithConcurrency(items, CONFIG.TMDB_CONCURRENCY, async (item) => {
      try {
        return await this.lookupImdbId(type, item.id, apiKey);
      } catch (err) {
        complete = false;
        console.error(`[TMDB] Failed to resolve IMDb ID for ${type} ${item.id}:`, err instanceof Error ? err.message : err);
        return null;
      }
    });

    // Only titles with valid IMDb IDs ('tt...') are returned so stream addons
    // (Torrentio, Comet, etc.) and player metadata providers can resolve streams.
    const metas: MetaPreview[] = [];
    items.forEach((item, i) => {
      const imdbId = imdbIds[i];
      if (imdbId) metas.push(this.toMetaPreview(type, item, imdbId, userLang, rpdbKey));
    });

    if (complete) cacheService.setCatalog(cacheKey, metas);
    return { metas, complete };
  }

  /** Page of /discover/movie or /discover/tv */
  private async discoverPage(
    type: MediaType,
    filters: ParsedFilters,
    page: number,
    minVotes: number,
    apiKey: string,
    language = CONFIG.TMDB_LANGUAGE
  ): Promise<TmdbDiscoverResponse<TmdbItem>> {
    const isMovie = type === 'movie';
    const params = new URLSearchParams({
      page: String(page),
      language,
      include_adult: 'false',
      'vote_count.gte': String(minVotes),
      sort_by: filters.sortBy ?? 'vote_average.desc'
    });

    if (isMovie) params.set('include_video', 'false');

    // Origin country: multiple country codes combined with OR via '|'
    if (filters.countries && filters.countries.length > 0) {
      params.set('with_origin_country', filters.countries.join('|'));
    }

    if (filters.voteAverageGte !== undefined) {
      params.set('vote_average.gte', String(filters.voteAverageGte));
    }

    // Release date range: upper bound never exceeds today to avoid unreleased titles
    const today = isoDate(new Date());
    let dateGte = filters.releaseDateGte;
    let dateLte = today;

    if (filters.year !== undefined) {
      dateGte = `${filters.year}-01-01`;
      dateLte = `${filters.year}-12-31`;
    } else {
      if (filters.yearGte !== undefined) dateGte = `${filters.yearGte}-01-01`;
      if (filters.yearLte !== undefined) dateLte = `${filters.yearLte}-12-31`;
    }
    if (dateLte > today) dateLte = today;

    const dateField = isMovie ? 'primary_release_date' : 'first_air_date';
    if (dateGte) params.set(`${dateField}.gte`, dateGte);
    params.set(`${dateField}.lte`, dateLte);

    return this.getJson<TmdbDiscoverResponse<TmdbItem>>(isMovie ? '/discover/movie' : '/discover/tv', params, apiKey);
  }

  /** Page of /search/movie or /search/tv */
  private async searchPage(
    type: MediaType,
    filters: ParsedFilters,
    page: number,
    apiKey: string,
    language = CONFIG.TMDB_LANGUAGE
  ): Promise<TmdbDiscoverResponse<TmdbItem>> {
    const isMovie = type === 'movie';
    const params = new URLSearchParams({
      query: filters.searchTitle ?? '',
      page: String(page),
      language,
      include_adult: 'false'
    });

    if (filters.year !== undefined) {
      params.set(isMovie ? 'primary_release_year' : 'first_air_date_year', String(filters.year));
    }

    return this.getJson<TmdbDiscoverResponse<TmdbItem>>(isMovie ? '/search/movie' : '/search/tv', params, apiKey);
  }

  /**
   * Retrieves IMDb ID (e.g. tt1283515) using cache and TMDB external_ids endpoint.
   * Returns null if title has no IMDb ID or if TMDB fails.
   */
  async getImdbId(type: MediaType, tmdbId: number, apiKey?: string): Promise<string | null> {
    try {
      return await this.lookupImdbId(type, tmdbId, apiKey || this.defaultApiKey);
    } catch (err) {
      console.error(`[TMDB] Failed to resolve IMDb ID for ${type} ${tmdbId}:`, err instanceof Error ? err.message : err);
      return null;
    }
  }

  /** Same as getImdbId but propagates TMDB errors. */
  private async lookupImdbId(type: MediaType, tmdbId: number, apiKey: string): Promise<string | null> {
    const cached = cacheService.getImdbId(type, tmdbId);
    if (cached) return cached;

    const path = type === 'movie' ? `/movie/${tmdbId}/external_ids` : `/tv/${tmdbId}/external_ids`;
    const data = await this.getJson<TmdbExternalIds>(path, new URLSearchParams(), apiKey);
    if (data.imdb_id && /^tt\d+$/.test(data.imdb_id)) {
      cacheService.setImdbId(type, tmdbId, data.imdb_id);
      return data.imdb_id;
    }
    return null;
  }

  /** Maps raw TMDB item to Stremio MetaPreview */
  private toMetaPreview(
    type: MediaType,
    item: TmdbItem,
    imdbId: string,
    userLang: 'en' | 'es' = 'en',
    rpdbKey?: string
  ): MetaPreview {
    const isMovie = type === 'movie';
    const isEs = userLang === 'es';
    const name = isMovie ? (item as TmdbMovieItem).title : (item as TmdbTvItem).name;
    const dateStr = isMovie ? (item as TmdbMovieItem).release_date : (item as TmdbTvItem).first_air_date;
    const year = dateStr ? dateStr.substring(0, 4) : '';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
    const backdropUrl = item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : undefined;

    // If user configured RPDB key, route poster via RPDB CDN which stamps rating badges
    const poster = rpdbKey
      ? `https://api.ratingposterdb.com/${encodeURIComponent(rpdbKey)}/imdb/poster-default/${imdbId}.jpg?fallback=true`
      : (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined);

    // Bilingual mapping of official TMDB genres
    const genres = item.genre_ids
      ?.map((id) => TMDB_GENRES[id]?.[userLang] || TMDB_GENRES[id]?.en)
      .filter((g): g is string => Boolean(g));

    // releaseInfo appears top left next to release year (e.g. "2026 · TMDB 8.6")
    const releaseInfo = year && rating ? `${year} · TMDB ${rating}` : (year || undefined);

    // Description is the clean movie overview without duplicated scores
    const description = item.overview || undefined;

    return {
      id: imdbId,
      type,
      name: name || (isEs ? 'Desconocido' : 'Unknown'),
      poster,
      posterShape: 'poster',
      background: backdropUrl,
      description,
      releaseInfo,
      // We deliberately omit imdbRating to avoid Stremio hardcoding its yellow [IMDb] badge
      // next to a score that originates from TMDB.
      genres: genres && genres.length > 0 ? genres : undefined
    };
  }
}

export const tmdbClient = new TmdbClient();
