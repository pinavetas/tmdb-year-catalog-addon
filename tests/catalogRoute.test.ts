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

test('Integration: Spanish movies by country', { skip: skipReason }, async () => {
  const data = await getCatalog('/catalog/movie/imdb_country_movies/genre=%F0%9F%87%AA%F0%9F%87%B8%20Espa%C3%B1a.json');
  assert.ok(data.metas.length > 0);
  assert.equal(data.metas[0].type, 'movie');
  assert.ok(data.metas.every((m) => /^tt\d+$/.test(m.id)));
});

test('Integration: year catalog default returns a full first page', { skip: skipReason }, async () => {
  const data = await getCatalog('/catalog/movie/imdb_rating_movies.json');
  assert.ok(data.metas.length > 90, `expected ~100 items, got ${data.metas.length}`);
  assert.ok(data.metas.every((m) => m.id.startsWith('tt')));
});

test('Integration: pagination returns a different block', { skip: skipReason }, async () => {
  const page1 = await getCatalog('/catalog/movie/imdb_rating_movies.json');
  const page2 = await getCatalog(`/catalog/movie/imdb_rating_movies/skip=${page1.metas.length}.json`);
  assert.ok(page2.metas.length > 0);
  const firstIds = new Set(page1.metas.map((m) => m.id));
  const overlap = page2.metas.filter((m) => firstIds.has(m.id)).length;
  assert.ok(overlap <= 2, `pages should not overlap (overlap=${overlap})`);
});

test('Integration: rating filter 8.0+', { skip: skipReason }, async () => {
  const data = await getCatalog('/catalog/movie/imdb_rating_movies/genre=%E2%AD%90%20IMDb%208.0%2B%20(Sobresaliente).json');
  assert.ok(data.metas.length > 0);
  for (const m of data.metas) {
    if (m.imdbRating) assert.ok(parseFloat(m.imdbRating) >= 7.95, `Expected rating >= 8.0, got ${m.imdbRating}`);
  }
});

test('Integration: year filter 2024', { skip: skipReason }, async () => {
  const data = await getCatalog('/catalog/movie/imdb_year_movies/genre=%F0%9F%93%85%202024.json');
  assert.ok(data.metas.length > 0);
  for (const m of data.metas) assert.equal(m.releaseInfo, '2024');
});

test('Integration: Nordic countries (OR filter)', { skip: skipReason }, async () => {
  const data = await getCatalog('/catalog/series/imdb_country_series/genre=%F0%9F%87%B8%F0%9F%87%AA%20Suecia%20%2F%20N%C3%B3rdicos.json');
  assert.ok(data.metas.length > 0);
  assert.equal(data.metas[0].type, 'series');
});

test('Integration: search by title and year', { skip: skipReason }, async () => {
  const data = await getCatalog('/catalog/movie/imdb_search_movies/search=dune%202024.json');
  assert.ok(data.metas.length > 0);
  assert.ok(data.metas.some((m) => m.name.toLowerCase().includes('dune')));
});

test('Integration: series year catalog', { skip: skipReason }, async () => {
  const data = await getCatalog('/catalog/series/imdb_year_series/genre=%F0%9F%93%85%202023.json');
  assert.ok(data.metas.length > 0);
  assert.equal(data.metas[0].type, 'series');
});

test('Catalog Route: invalid catalog returns empty metas array', async () => {
  const data = await getCatalog('/catalog/movie/non_existent_catalog.json');
  assert.deepEqual(data.metas, []);
});
