/**
 * Tests de integración contra la API real de TMDB (requieren TMDB_API_KEY en el entorno o en .env).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { CONFIG } from '../src/config.js';
import type { CatalogResponse } from '../src/types/stremio.js';

const skipReason = CONFIG.TMDB_API_KEY ? false : 'TMDB_API_KEY no configurada';

async function getCatalog(path: string): Promise<CatalogResponse> {
  const res = await app.request(path);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type')?.includes('application/json'), true);
  return (await res.json()) as CatalogResponse;
}

test('Integration: movies catalog default returns a full first page', { skip: skipReason }, async () => {
  const data = await getCatalog('/catalog/movie/imdb_movies.json');
  assert.ok(data.metas.length > 50, `expected items, got ${data.metas.length}`);
  assert.ok(data.metas.every((m) => m.id.startsWith('tt')));
});

test('Integration: pagination returns a different block', { skip: skipReason }, async () => {
  const page1 = await getCatalog('/catalog/movie/imdb_movies.json');
  const page2 = await getCatalog(`/catalog/movie/imdb_movies/skip=${page1.metas.length}.json`);
  assert.ok(page2.metas.length > 0);
  const firstIds = new Set(page1.metas.map((m) => m.id));
  const overlap = page2.metas.filter((m) => firstIds.has(m.id)).length;
  assert.ok(overlap <= 2, `pages should not overlap (overlap=${overlap})`);
});

test('Integration: year filter 2024', { skip: skipReason }, async () => {
  const data = await getCatalog('/catalog/movie/imdb_movies/genre=%F0%9F%93%85%202024.json');
  assert.ok(data.metas.length > 0);
  for (const m of data.metas) assert.equal(m.releaseInfo, '2024');
});

test('Integration: series year catalog', { skip: skipReason }, async () => {
  const data = await getCatalog('/catalog/series/imdb_series/genre=%F0%9F%93%85%202023.json');
  assert.ok(data.metas.length > 0);
  assert.equal(data.metas[0].type, 'series');
});

test('Catalog Route: invalid catalog returns empty metas array', async () => {
  const data = await getCatalog('/catalog/movie/non_existent_catalog.json');
  assert.deepEqual(data.metas, []);
});
