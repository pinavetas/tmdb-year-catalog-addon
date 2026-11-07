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

export class TmdbClient {
  private baseUrl = 'https://api.themoviedb.org/3';
  private defaultApiKey: string;

  constructor(apiKey?: string) {
    this.defaultApiKey = apiKey ?? CONFIG.TMDB_API_KEY;
  }

  /**
   * Construye la URL y cabeceras de autenticación. TMDB acepta la clave v3 como query param
   * (`api_key`) o el token de lectura v4 (JWT) como cabecera `Authorization: Bearer`.
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
   * GET JSON con timeout y reintentos ante 429 (rate limit), 5xx y errores de red.
   * Lanza TmdbError si la respuesta final no es correcta.
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
          throw new TmdbError(`TMDB ${res.status} en ${path}: ${body.slice(0, 200)}`, res.status);
        }

        return (await res.json()) as T;
      } catch (err) {
        // Errores HTTP definitivos (4xx) no se reintentan
        if (err instanceof TmdbError) throw err;
        lastError = err;
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
      }
    }

    throw new TmdbError(`TMDB inaccesible en ${path}: ${String(lastError)}`);
  }

  /**
   * Obtiene un bloque de hasta CATALOG_PAGE_SIZE (100) títulos aplicando filtros y configuración
   * de usuario. Lanza TmdbError ante fallos de TMDB (que no se cachean).
   */
  async getCatalog(type: MediaType, filters: ParsedFilters, userConfig?: AddonUserConfig): Promise<MetaPreview[]> {
    return (await this.getCatalogResult(type, filters, userConfig)).metas;
  }

  /**
   * Igual que getCatalog, pero indica además si el resultado está completo. Si la resolución de
   * algún IMDb ID falló de forma transitoria (rate limit, timeout...), `complete` es false y el
   * resultado no se guarda en caché para no fijar durante horas un listado incompleto.
   */
  async getCatalogResult(
    type: MediaType,
    filters: ParsedFilters,
    userConfig?: AddonUserConfig
  ): Promise<{ metas: MetaPreview[]; complete: boolean }> {
    const apiKey = userConfig?.tmdbApiKey?.trim() || this.defaultApiKey;
    if (!apiKey) {
      throw new TmdbError('No hay API key de TMDB configurada (variable de entorno TMDB_API_KEY)');
    }

    const minVotes =
      type === 'movie'
        ? userConfig?.minVotesMovie ?? CONFIG.DEFAULT_MIN_VOTES_MOVIE
        : userConfig?.minVotesSeries ?? CONFIG.DEFAULT_MIN_VOTES_SERIES;

    // Paginación: stremio-core envía skip = nº de títulos ya recibidos. Como se descartan los
    // pocos títulos sin IMDb ID, un bloque puede traer algo menos de 100; redondear absorbe
    // esa diferencia y mantiene la paginación estable.
    const block = Math.round(filters.skip / CONFIG.CATALOG_PAGE_SIZE);
    const pagesPerBlock = CONFIG.CATALOG_PAGE_SIZE / TMDB_PAGE_SIZE;
    const firstPage = block * pagesPerBlock + 1;

    // 1. Caché por consulta normalizada (los resultados no dependen de la API key)
    const { skip: _skip, ...queryFilters } = filters;
    const cacheKey = `${type}:${JSON.stringify(queryFilters)}:${minVotes}:${block}:${CONFIG.TMDB_LANGUAGE}`;
    const cached = cacheService.getCatalog(cacheKey);
    if (cached) return { metas: cached, complete: true };

    // 2. Búsqueda por título o descubrimiento por filtros
    const fetchPage = (page: number) =>
      filters.searchTitle
        ? this.searchPage(type, filters, page, apiKey)
        : this.discoverPage(type, filters, page, minVotes, apiKey);

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

    // En búsquedas por título con nota mínima ("dune 7+") se filtra localmente
    if (filters.searchTitle && filters.voteAverageGte !== undefined) {
      items = items.filter((item) => item.vote_average >= filters.voteAverageGte!);
    }

    // 3. Resolver IMDb IDs con concurrencia limitada (respeta el rate limit de TMDB)
    let complete = true;
    const imdbIds = await mapWithConcurrency(items, CONFIG.TMDB_CONCURRENCY, async (item) => {
      try {
        return await this.lookupImdbId(type, item.id, apiKey);
      } catch (err) {
        complete = false;
        console.error(`[TMDB] Fallo al resolver IMDb ID para ${type} ${item.id}:`, err instanceof Error ? err.message : err);
        return null;
      }
    });

    // Solo se devuelven títulos con IMDb ID ('tt...') para que Cinemeta y los addons de streams
    // (Torrentio, Comet...) puedan abrirlos y reproducirlos.
    const metas: MetaPreview[] = [];
    items.forEach((item, i) => {
      const imdbId = imdbIds[i];
      if (imdbId) metas.push(this.toMetaPreview(type, item, imdbId));
    });

    if (complete) cacheService.setCatalog(cacheKey, metas);
    return { metas, complete };
  }

  /** Página de /discover/movie o /discover/tv */
  private async discoverPage(
    type: MediaType,
    filters: ParsedFilters,
    page: number,
    minVotes: number,
    apiKey: string
  ): Promise<TmdbDiscoverResponse<TmdbItem>> {
    const isMovie = type === 'movie';
    const params = new URLSearchParams({
      page: String(page),
      language: CONFIG.TMDB_LANGUAGE,
      include_adult: 'false',
      'vote_count.gte': String(minVotes),
      sort_by: filters.sortBy ?? 'vote_average.desc'
    });

    if (isMovie) params.set('include_video', 'false');

    // País de origen: varios códigos se combinan con OR mediante '|'
    if (filters.countries && filters.countries.length > 0) {
      params.set('with_origin_country', filters.countries.join('|'));
    }

    if (filters.voteAverageGte !== undefined) {
      params.set('vote_average.gte', String(filters.voteAverageGte));
    }

    // Rango de fechas de estreno. El límite superior nunca supera hoy para no mostrar
    // títulos aún no estrenados (sin streams disponibles).
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

  /** Página de /search/movie o /search/tv */
  private async searchPage(
    type: MediaType,
    filters: ParsedFilters,
    page: number,
    apiKey: string
  ): Promise<TmdbDiscoverResponse<TmdbItem>> {
    const isMovie = type === 'movie';
    const params = new URLSearchParams({
      query: filters.searchTitle ?? '',
      page: String(page),
      language: CONFIG.TMDB_LANGUAGE,
      include_adult: 'false'
    });

    if (filters.year !== undefined) {
      params.set(isMovie ? 'primary_release_year' : 'first_air_date_year', String(filters.year));
    }

    return this.getJson<TmdbDiscoverResponse<TmdbItem>>(isMovie ? '/search/movie' : '/search/tv', params, apiKey);
  }

  /**
   * Obtiene el IMDb ID (ej: tt1283515) usando caché y el endpoint external_ids.
   * Devuelve null si el título no tiene IMDb ID o si TMDB falla.
   */
  async getImdbId(type: MediaType, tmdbId: number, apiKey?: string): Promise<string | null> {
    try {
      return await this.lookupImdbId(type, tmdbId, apiKey || this.defaultApiKey);
    } catch (err) {
      console.error(`[TMDB] Fallo al resolver IMDb ID para ${type} ${tmdbId}:`, err instanceof Error ? err.message : err);
      return null;
    }
  }

  /** Igual que getImdbId pero propaga los errores de TMDB. */
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

  /** Mapea un ítem crudo de TMDB al objeto MetaPreview de Stremio */
  private toMetaPreview(type: MediaType, item: TmdbItem, imdbId: string): MetaPreview {
    const isMovie = type === 'movie';
    const name = isMovie ? (item as TmdbMovieItem).title : (item as TmdbTvItem).name;
    const dateStr = isMovie ? (item as TmdbMovieItem).release_date : (item as TmdbTvItem).first_air_date;
    const backdropUrl = item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : undefined;

    return {
      id: imdbId,
      type,
      name: name || 'Desconocido',
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
      posterShape: 'poster',
      background: backdropUrl,
      description: item.overview || undefined,
      releaseInfo: dateStr ? dateStr.substring(0, 4) : undefined,
      // Nota de TMDB (0-10), usada como aproximación a la nota de IMDb
      imdbRating: item.vote_average ? item.vote_average.toFixed(1) : undefined
    };
  }
}

export const tmdbClient = new TmdbClient();
