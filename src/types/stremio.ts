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
  /** URL absoluta a un logo PNG de 256x256 px */
  logo?: string;
  /** URL absoluta a una imagen PNG/JPG de fondo de al menos 1024x786 px */
  background?: string;
  /** Email de contacto (botón "Report" de Stremio) */
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
  /** Segundos que el cliente puede cachear la respuesta (Stremio Protocol v3) */
  cacheMaxAge?: number;
  /** Segundos durante los que se puede servir la respuesta caducada mientras se revalida */
  staleRevalidate?: number;
  /** Segundos durante los que se puede servir la respuesta caducada si el addon falla */
  staleError?: number;
}
