import test from 'node:test';
import assert from 'node:assert/strict';
import { CacheService } from '../src/services/cacheService.js';
import type { MetaPreview } from '../src/types/stremio.js';

test('CacheService: should cache and retrieve catalog entries', () => {
  const cache = new CacheService();
  const mockMetas: MetaPreview[] = [
    { id: 'tt1234567', type: 'movie', name: 'Test Movie', releaseInfo: '2024' }
  ];

  assert.equal(cache.getCatalog('movie:test'), undefined);
  cache.setCatalog('movie:test', mockMetas);

  const cached = cache.getCatalog('movie:test');
  assert.deepEqual(cached, mockMetas);
});

test('CacheService: should cache and retrieve IMDb ID mappings', () => {
  const cache = new CacheService();

  assert.equal(cache.getImdbId('movie', 693134), undefined);
  cache.setImdbId('movie', 693134, 'tt15239678');

  assert.equal(cache.getImdbId('movie', 693134), 'tt15239678');
  assert.equal(cache.getStats().idMapSize, 1);
});
