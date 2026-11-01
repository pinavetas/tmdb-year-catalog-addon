/**
 * TMDB API v3 Types
 */

export interface TmdbMovieItem {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
}

export interface TmdbTvItem {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
}

export type TmdbItem = TmdbMovieItem | TmdbTvItem;

export interface TmdbDiscoverResponse<T = TmdbItem> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbExternalIds {
  id: number;
  imdb_id: string | null;
  freebase_mid?: string | null;
  freebase_id?: string | null;
  tvdb_id?: number | null;
  tvrage_id?: number | null;
  wikidata_id?: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
}
