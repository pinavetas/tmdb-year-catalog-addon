import test from 'node:test';
import assert from 'node:assert/strict';
import { tmdbClient } from '../src/services/tmdbClient.js';
import { cacheService } from '../src/services/cacheService.js';

test('TmdbClient: should fetch and map movies from TMDB API with IMDb IDs', async () => {
  cacheService.clearAll();

  const metas = await tmdbClient.getCatalog('movie', {
    year: 2024,
    voteAverageGte: 8.0,
    skip: 0
  });

  assert.ok(metas.length > 0, 'Should return at least one movie');
  
  const first = metas[0];
  assert.equal(first.type, 'movie');
  assert.ok(first.name.length > 0);
  assert.ok(first.id.startsWith('tt') || first.id.startsWith('tmdb:'), 'ID should be valid');
  assert.equal(first.releaseInfo, '2024');
  assert.ok(first.poster?.startsWith('https://image.tmdb.org/t/p/'));

  // Test that cache was populated
  const stats = cacheService.getStats();
  assert.ok(stats.catalogSize > 0, 'Catalog cache should have entries');
});

test('TmdbClient: should fetch and map series from TMDB API with IMDb IDs', async () => {
  const metas = await tmdbClient.getCatalog('series', {
    year: 2024,
    voteAverageGte: 8.0,
    skip: 0
  });

  assert.ok(metas.length > 0, 'Should return at least one series');
  const first = metas[0];
  assert.equal(first.type, 'series');
  assert.ok(first.name.length > 0);
  assert.equal(first.releaseInfo, '2024');
});
