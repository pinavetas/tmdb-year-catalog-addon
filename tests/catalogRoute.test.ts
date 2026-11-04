import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { CONFIG } from '../src/config.js';
import type { CatalogResponse } from '../src/types/stremio.js';

test('Catalog Route: GET /catalog/movie/imdb_country_movies/genre=🇪🇸 España.json returns Spanish movies', async (t) => {
  if (!CONFIG.TMDB_API_KEY) {
    t.skip('Skipped: TMDB_API_KEY is not configured in environment');
    return;
  }
  const res = await app.request('/catalog/movie/imdb_country_movies/genre=%F0%9F%87%AA%F0%9F%87%B8%20Espa%C3%B1a.json');
  assert.equal(res.status, 200);

  const data = (await res.json()) as CatalogResponse;
  assert.ok(data.metas.length > 0);
  assert.equal(data.metas[0].type, 'movie');
});

test('Catalog Route: GET /catalog/movie/imdb_year_movies.json returns default movies', async (t) => {
  if (!CONFIG.TMDB_API_KEY) {
    t.skip('Skipped: TMDB_API_KEY is not configured in environment');
    return;
  }
  const res = await app.request('/catalog/movie/imdb_year_movies.json');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type')?.includes('application/json'), true);

  const data = (await res.json()) as CatalogResponse;
  assert.ok(Array.isArray(data.metas));
  assert.ok(data.metas.length > 0);
  assert.equal(data.metas[0].type, 'movie');
  assert.ok(data.metas[0].id.startsWith('tt') || data.metas[0].id.startsWith('tmdb:'));
});

test('Catalog Route: GET /catalog/movie/imdb_year_movies/genre=⭐ IMDb 8.0+.json filters by rating', async (t) => {
  if (!CONFIG.TMDB_API_KEY) {
    t.skip('Skipped: TMDB_API_KEY is not configured in environment');
    return;
  }
  const res = await app.request('/catalog/movie/imdb_year_movies/genre=⭐ IMDb 8.0+.json');
  assert.equal(res.status, 200);

  const data = (await res.json()) as CatalogResponse;
  assert.ok(data.metas.length > 0);
  for (const m of data.metas) {
    if (m.imdbRating) {
      assert.ok(parseFloat(m.imdbRating) >= 7.8, `Expected rating >= 8.0, got ${m.imdbRating}`);
    }
  }
});

test('Catalog Route: GET /catalog/movie/imdb_year_movies/genre=📅 2024.json filters by year', async (t) => {
  if (!CONFIG.TMDB_API_KEY) {
    t.skip('Skipped: TMDB_API_KEY is not configured in environment');
    return;
  }
  const res = await app.request('/catalog/movie/imdb_year_movies/genre=📅 2024.json');
  assert.equal(res.status, 200);

  const data = (await res.json()) as CatalogResponse;
  assert.ok(data.metas.length > 0);
  for (const m of data.metas) {
    assert.equal(m.releaseInfo, '2024');
  }
});

test('Catalog Route: GET /catalog/movie/imdb_year_movies/search=dune 2024.json searches by title and year', async (t) => {
  if (!CONFIG.TMDB_API_KEY) {
    t.skip('Skipped: TMDB_API_KEY is not configured in environment');
    return;
  }
  const res = await app.request('/catalog/movie/imdb_year_movies/search=dune 2024.json');
  assert.equal(res.status, 200);

  const data = (await res.json()) as CatalogResponse;
  assert.ok(data.metas.length > 0);
  const titles = data.metas.map(m => m.name.toLowerCase());
  assert.ok(titles.some(t => t.includes('dune')));
});

test('Catalog Route: GET /catalog/series/imdb_year_series.json returns series', async (t) => {
  if (!CONFIG.TMDB_API_KEY) {
    t.skip('Skipped: TMDB_API_KEY is not configured in environment');
    return;
  }
  const res = await app.request('/catalog/series/imdb_year_series.json');
  assert.equal(res.status, 200);

  const data = (await res.json()) as CatalogResponse;
  assert.ok(data.metas.length > 0);
  assert.equal(data.metas[0].type, 'series');
});

test('Catalog Route: invalid catalog returns empty metas array', async () => {
  const res = await app.request('/catalog/movie/non_existent_catalog.json');
  assert.equal(res.status, 200);
  const data = (await res.json()) as CatalogResponse;
  assert.deepEqual(data.metas, []);
});
