/**
 * Integration tests against real TMDB API (require TMDB_API_KEY in environment or .env).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmdbClient } from '../src/services/tmdbClient.js';
import { cacheService } from '../src/services/cacheService.js';
import { CONFIG } from '../src/config.js';

const skipReason = CONFIG.TMDB_API_KEY ? false : 'TMDB_API_KEY not configured';

test('TmdbClient: should fetch and map movies from TMDB API with IMDb IDs', { skip: skipReason }, async () => {
  cacheService.clearAll();

  const metas = await tmdbClient.getCatalog('movie', { year: 2024, voteAverageGte: 8.0, skip: 0 });

  assert.ok(metas.length > 0, 'Should return at least one movie');
  const first = metas[0];
  assert.equal(first.type, 'movie');
  assert.ok(first.name.length > 0);
  assert.match(first.id, /^tt\d+$/);
  assert.ok(first.releaseInfo?.startsWith('2024'));
  assert.ok(first.poster?.startsWith('https://image.tmdb.org/t/p/'));
  assert.ok(cacheService.getStats().catalogSize > 0, 'Catalog cache should have entries');
});

test('TmdbClient: should fetch and map series from TMDB API with IMDb IDs', { skip: skipReason }, async () => {
  const metas = await tmdbClient.getCatalog('series', { year: 2024, voteAverageGte: 8.0, skip: 0 });

  assert.ok(metas.length > 0, 'Should return at least one series');
  const first = metas[0];
  assert.equal(first.type, 'series');
  assert.match(first.id, /^tt\d+$/);
  assert.ok(first.releaseInfo?.startsWith('2024'));
});
