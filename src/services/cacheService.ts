import { LRUCache } from 'lru-cache';
import { CONFIG } from '../config.js';
import type { MetaPreview } from '../types/stremio.js';

export class CacheService {
  // In-memory cache for full catalog query responses
  private catalogCache = new LRUCache<string, MetaPreview[]>({
    max: 1000,
    ttl: CONFIG.CACHE_TTL_CATALOG_MS,
    allowStale: false,
    updateAgeOnGet: false
  });

  // Mapping cache: TMDB -> IMDb ID ('movie:1234' -> 'tt1234567')
  private idMappingCache = new LRUCache<string, string>({
    max: 50000,
    ttl: CONFIG.CACHE_TTL_IDS_MS,
    allowStale: false,
    updateAgeOnGet: true
  });

  // Catalog methods
  getCatalog(key: string): MetaPreview[] | undefined {
    return this.catalogCache.get(key);
  }

  setCatalog(key: string, data: MetaPreview[]): void {
    this.catalogCache.set(key, data);
  }

  // ID mapping methods
  getImdbId(type: 'movie' | 'series', tmdbId: number): string | undefined {
    return this.idMappingCache.get(`${type}:${tmdbId}`);
  }

  setImdbId(type: 'movie' | 'series', tmdbId: number, imdbId: string): void {
    this.idMappingCache.set(`${type}:${tmdbId}`, imdbId);
  }

  // Stats and flush
  clearAll(): void {
    this.catalogCache.clear();
    this.idMappingCache.clear();
  }

  getStats(): { catalogSize: number; idMapSize: number } {
    return {
      catalogSize: this.catalogCache.size,
      idMapSize: this.idMappingCache.size
    };
  }
}

export const cacheService = new CacheService();
