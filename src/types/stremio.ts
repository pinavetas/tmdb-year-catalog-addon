/**
 * Stremio Addon Protocol v3 Type Definitions
 */

export type ContentType = 'movie' | 'series' | 'channel' | 'tv' | 'other';

export interface CatalogExtra {
  name: 'search' | 'genre' | 'skip' | string;
  isRequired?: boolean;
  options?: string[];
  optionsLimit?: number;
}

export interface CatalogDefinition {
  type: ContentType;
  id: string;
  name: string;
  extra?: CatalogExtra[];
}

export interface ManifestBehaviorHints {
  configurable?: boolean;
  configurationRequired?: boolean;
}

export interface Manifest {
  id: string;
  version: string;
  name: string;
  description: string;
  /** Absolute URL to a 256x256 px PNG logo */
  logo?: string;
  /** Absolute URL to a background wallpaper (at least 1024x786 px) */
  background?: string;
  /** Contact email ("Report" button in Stremio) */
  contactEmail?: string;
  resources: Array<
    | 'catalog'
    | 'meta'
    | 'stream'
    | 'subtitles'
    | {
        name: 'catalog' | 'meta' | 'stream' | 'subtitles';
        types: ContentType[];
        idPrefixes?: string[];
      }
  >;
  types: ContentType[];
  catalogs: CatalogDefinition[];
  idPrefixes?: string[];
  behaviorHints?: ManifestBehaviorHints;
}

export interface MetaPreview {
  id: string;
  type: ContentType;
  name: string;
  poster?: string;
  posterShape?: 'poster' | 'landscape' | 'square';
  background?: string;
  banner?: string;
  logo?: string;
  description?: string;
  releaseInfo?: string;
  imdbRating?: string;
  genres?: string[];
}

export interface CatalogResponse {
  metas: MetaPreview[];
  /** Seconds the client can cache the response (Stremio Protocol v3) */
  cacheMaxAge?: number;
  /** Seconds expired response can be served while revalidating */
  staleRevalidate?: number;
  /** Seconds expired response can be served if the addon errors */
  staleError?: number;
}
