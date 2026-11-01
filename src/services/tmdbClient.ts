import { CONFIG } from '../config.js';
import { cacheService } from './cacheService.js';
import type { ParsedFilters } from './queryParser.js';
import type { MetaPreview } from '../types/stremio.js';
import type { TmdbDiscoverResponse, TmdbExternalIds, TmdbMovieItem, TmdbTvItem } from '../types/tmdb.js';

export class TmdbClient {
  private baseUrl = 'https://api.themoviedb.org/3';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || CONFIG.TMDB_API_KEY;
  }

  /**
   * Obtiene el catálogo de películas o series aplicando los filtros parseados
   */
  async getCatalog(type: 'movie' | 'series', filters: ParsedFilters): Promise<MetaPreview[]> {
    // 1. Clave de caché para esta consulta exacta
    const cacheKey = `${type}:${JSON.stringify(filters)}`;
    const cached = cacheService.getCatalog(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Determinar si es búsqueda por texto o filtrado por parámetros discover
    let items: Array<TmdbMovieItem | TmdbTvItem> = [];
    const page = Math.floor(filters.skip / 20) + 1;

    if (filters.searchTitle) {
      items = await this.searchByTitle(type, filters.searchTitle, filters.year, page);
    } else {
      items = await this.discover(type, filters, page);
    }

    // 3. Mapear los elementos a MetaPreview resolviendo los IDs de IMDb concurrentemente
    const metas = await Promise.all(
      items.map(async (item) => this.mapToMetaPreview(type, item))
    );

    // 4. Guardar en caché antes de devolver
    cacheService.setCatalog(cacheKey, metas);
    return metas;
  }

  /**
   * Llamada a /discover/movie o /discover/tv
   */
  private async discover(
    type: 'movie' | 'series',
    filters: ParsedFilters,
    page: number
  ): Promise<Array<TmdbMovieItem | TmdbTvItem>> {
    const isMovie = type === 'movie';
    const endpoint = isMovie ? '/discover/movie' : '/discover/tv';
    const params = new URLSearchParams({
      api_key: this.apiKey,
      page: page.toString(),
      language: 'es-ES',
      include_adult: 'false'
    });

    // Puntuación mínima y votos
    const minVotes = isMovie ? CONFIG.DEFAULT_MIN_VOTES_MOVIE : CONFIG.DEFAULT_MIN_VOTES_SERIES;
    params.set('vote_count.gte', minVotes.toString());

    if (filters.voteAverageGte !== undefined) {
      params.set('vote_average.gte', filters.voteAverageGte.toString());
      // Si se filtra por nota, ordenar por nota descendente para mostrar lo mejor primero
      params.set('sort_by', 'vote_average.desc');
    } else {
      // Si no hay nota mínima explícita, ordenar por popularidad
      params.set('sort_by', 'popularity.desc');
    }

    // Filtros de año exacto
    if (filters.year !== undefined) {
      if (isMovie) {
        params.set('primary_release_year', filters.year.toString());
      } else {
        params.set('first_air_date_year', filters.year.toString());
      }
    }

    // Filtros de rango de años
    if (filters.yearGte !== undefined) {
      const field = isMovie ? 'primary_release_date.gte' : 'first_air_date.gte';
      params.set(field, `${filters.yearGte}-01-01`);
    }

    if (filters.yearLte !== undefined) {
      const field = isMovie ? 'primary_release_date.lte' : 'first_air_date.lte';
      params.set(field, `${filters.yearLte}-12-31`);
    }

    const url = `${this.baseUrl}${endpoint}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[TMDB] Error ${res.status} en discover: ${await res.text()}`);
      return [];
    }

    const data = (await res.json()) as TmdbDiscoverResponse<TmdbMovieItem | TmdbTvItem>;
    return data.results || [];
  }

  /**
   * Búsqueda por texto libre /search/movie o /search/tv
   */
  private async searchByTitle(
    type: 'movie' | 'series',
    query: string,
    year: number | undefined,
    page: number
  ): Promise<Array<TmdbMovieItem | TmdbTvItem>> {
    const isMovie = type === 'movie';
    const endpoint = isMovie ? '/search/movie' : '/search/tv';
    const params = new URLSearchParams({
      api_key: this.apiKey,
      query: query,
      page: page.toString(),
      language: 'es-ES',
      include_adult: 'false'
    });

    if (year !== undefined) {
      if (isMovie) params.set('primary_release_year', year.toString());
      else params.set('first_air_date_year', year.toString());
    }

    const url = `${this.baseUrl}${endpoint}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[TMDB] Error ${res.status} en search: ${await res.text()}`);
      return [];
    }

    const data = (await res.json()) as TmdbDiscoverResponse<TmdbMovieItem | TmdbTvItem>;
    return data.results || [];
  }

  /**
   * Obtiene el IMDb ID (ej: tt1283515) usando caché y el endpoint external_ids
   */
  async getImdbId(type: 'movie' | 'series', tmdbId: number): Promise<string | null> {
    // 1. Revisar caché
    const cached = cacheService.getImdbId(type, tmdbId);
    if (cached) return cached;

    // 2. Consultar TMDB
    const endpoint = type === 'movie' ? `/movie/${tmdbId}/external_ids` : `/tv/${tmdbId}/external_ids`;
    const url = `${this.baseUrl}${endpoint}?api_key=${this.apiKey}`;

    try {
      const res = await fetch(url);
      if (!res.ok) return null;

      const data = (await res.json()) as TmdbExternalIds;
      if (data.imdb_id) {
        cacheService.setImdbId(type, tmdbId, data.imdb_id);
        return data.imdb_id;
      }
    } catch (err) {
      console.error(`[TMDB] Fallo al resolver IMDb ID para ${type} ${tmdbId}:`, err);
    }

    return null;
  }

  /**
   * Mapea un ítem crudo de TMDB al objeto MetaPreview de Stremio
   */
  private async mapToMetaPreview(
    type: 'movie' | 'series',
    item: TmdbMovieItem | TmdbTvItem
  ): Promise<MetaPreview> {
    const isMovie = type === 'movie';
    const name = isMovie ? (item as TmdbMovieItem).title : (item as TmdbTvItem).name;
    const dateStr = isMovie ? (item as TmdbMovieItem).release_date : (item as TmdbTvItem).first_air_date;
    const releaseInfo = dateStr ? dateStr.substring(0, 4) : undefined;

    // Resolver ID de IMDb
    const imdbId = await this.getImdbId(type, item.id);
    const finalId = imdbId || `tmdb:${item.id}`;

    return {
      id: finalId,
      type: type,
      name: name || 'Desconocido',
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
      banner: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : undefined,
      description: item.overview || undefined,
      releaseInfo: releaseInfo,
      imdbRating: item.vote_average ? item.vote_average.toFixed(1) : undefined,
      posterShape: 'poster'
    };
  }
}

export const tmdbClient = new TmdbClient();
