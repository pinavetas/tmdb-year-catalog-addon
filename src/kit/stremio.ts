/**
 * Tipos mínimos del protocolo de addons de Stremio v3 (comunes a toda la familia).
 * https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
 */
export type ContentType = 'movie' | 'series' | 'channel' | 'tv' | (string & {});
export type ResourceName = 'catalog' | 'meta' | 'stream' | 'subtitles' | 'addon_catalog';

export interface ManifestExtra {
  name: string;
  isRequired?: boolean;
  options?: string[];
  optionsLimit?: number;
}

export interface ManifestCatalog {
  type: ContentType;
  id: string;
  name: string;
  extra?: ManifestExtra[];
}

export interface AddonManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  logo?: string;
  background?: string;
  resources: Array<ResourceName | { name: ResourceName; types: ContentType[]; idPrefixes?: string[] }>;
  types: ContentType[];
  idPrefixes?: string[];
  catalogs: ManifestCatalog[];
  behaviorHints?: {
    adult?: boolean;
    p2p?: boolean;
    configurable?: boolean;
    configurationRequired?: boolean;
  };
}

export interface StreamItem {
  url?: string;
  ytId?: string;
  externalUrl?: string;
  name?: string;
  title?: string;
  description?: string;
  behaviorHints?: {
    notWebReady?: boolean;
    bingeGroup?: string;
    proxyHeaders?: { request?: Record<string, string>; response?: Record<string, string> };
    filename?: string;
    videoSize?: number;
  };
}

export interface SubtitleItem {
  id: string;
  url: string;
  lang: string;
}

export interface MetaPreviewItem {
  id: string;
  type: ContentType;
  name: string;
  poster?: string;
  posterShape?: 'square' | 'poster' | 'landscape';
  description?: string;
  releaseInfo?: string;
}
